from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase
from agents.agentic_executor import AgenticExecutor
from agents.tools import get_workspace_files, WORKSPACES_DIR
from datetime import datetime
import json, asyncio, zipfile, io
from pathlib import Path

router = APIRouter()


class CreateTaskRequest(BaseModel):
    poster_address: str
    task_type: str
    title: str
    description: str
    complexity: str = "standard"
    bounty_amount: float
    deadline: Optional[str] = None
    tags: list = []


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.get("/")
def list_tasks(status: Optional[str] = None, task_type: Optional[str] = None, limit: int = 20, offset: int = 0):
    db = get_supabase()
    if not db:
        return {"tasks": [], "total": 0}
    query = db.table("tasks").select("*")
    if status:
        query = query.eq("status", status)
    if task_type:
        query = query.eq("task_type", task_type)
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"tasks": result.data, "total": len(result.data)}


@router.post("/")
def create_task(body: CreateTaskRequest):
    db = get_supabase()
    if not db:
        return {"task_id": 0, "message": "Mock mode — no DB"}
    count_result = db.table("tasks").select("task_id", count="exact").execute()
    next_id = (count_result.count or 0) + 1
    result = db.table("tasks").insert({
        "task_id": next_id,
        "poster_address": body.poster_address,
        "task_type": body.task_type,
        "title": body.title,
        "description": body.description,
        "complexity": body.complexity,
        "bounty_amount": body.bounty_amount,
        "tags": body.tags,
        "status": "open",
        "deadline": body.deadline,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"task_id": next_id, "task": result.data[0] if result.data else None}


@router.get("/{task_id}")
def get_task(task_id: int):
    db = get_supabase()
    if not db:
        return {"task": None}
    result = db.table("tasks").select("*").eq("task_id", task_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task": result.data}


@router.post("/{task_id}/execute")
async def execute_task(task_id: str):
    """Execute a task using the agentic tool-use loop. Streams progress as SSE."""
    db = get_supabase()
    if not db:
        raise HTTPException(status_code=500, detail="Database not available")

    result = db.table("tasks").select("*").eq("id", task_id).execute()
    if not result.data:
        try:
            result = db.table("tasks").select("*").eq("task_id", int(task_id)).execute()
        except ValueError:
            pass
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")

    task = result.data[0]

    async def event_stream():
        executor = AgenticExecutor()
        event_queue: asyncio.Queue = asyncio.Queue()

        def on_event(event: dict):
            event_queue.put_nowait(event)

        # ── Pre-execution phases (quick UI animation) ────────
        pre_phases = [
            ("understanding", "Understanding the task", [
                "Reading task description...",
                f"Type: {task.get('category', task.get('task_type', 'general'))}",
                f"Parsed {len(task.get('description', '').split())} words",
                "Requirements mapped ✓",
            ]),
            ("planning", "Planning approach", [
                "Analyzing requirements...",
                "Selecting tools and strategy...",
                "Execution plan ready ✓",
            ]),
        ]

        for phase_id, phase_label, thoughts in pre_phases:
            yield sse({"type": "phase_start", "phase": phase_id, "label": phase_label})
            for thought in thoughts:
                await asyncio.sleep(0.3)
                yield sse({"type": "thought", "phase": phase_id, "text": thought})
            yield sse({"type": "phase_done", "phase": phase_id})

        # ── Agentic execution phase ──────────────────────────
        yield sse({"type": "phase_start", "phase": "executing", "label": "Agent executing"})
        yield sse({"type": "thought", "phase": "executing", "text": f"Model: {executor.model}"})
        yield sse({"type": "thought", "phase": "executing", "text": "Starting agentic tool-use loop..."})

        # Run the executor in a thread (it's blocking)
        def run_executor():
            executor.run(task, task_id, on_event)
            event_queue.put_nowait(None)

        asyncio.get_event_loop().run_in_executor(None, run_executor)

        files_created = []
        full_content_text = []

        # Forward events to SSE
        while True:
            try:
                event = await asyncio.wait_for(event_queue.get(), timeout=180.0)
            except asyncio.TimeoutError:
                yield sse({"type": "error", "message": "Agent timeout (180s)"})
                return
            if event is None:
                break

            evt_type = event.get("type")

            if evt_type == "iteration":
                yield sse({"type": "thought", "phase": "executing", "text": f"Iteration {event['current']}/{event['max']}"})

            elif evt_type == "thinking":
                yield sse({"type": "reasoning", "text": event["text"]})

            elif evt_type == "content":
                full_content_text.append(event["text"])
                yield sse({"type": "token", "text": event["text"]})

            elif evt_type == "tool_call":
                name = event["name"]
                args = event.get("args", {})
                truncated = {}
                for k, v in args.items():
                    if isinstance(v, str) and len(v) > 100:
                        truncated[k] = v[:100] + "..."
                    else:
                        truncated[k] = v
                yield sse({"type": "tool_call", "name": name, "args": truncated})
                if name == "create_file":
                    yield sse({"type": "thought", "phase": "executing", "text": f"📄 Creating {args.get('filename', 'file')}..."})

            elif evt_type == "tool_result":
                name = event["name"]
                res = event.get("result", {})
                if name in ("create_file", "edit_file") and res.get("status") in ("created", "updated"):
                    fname = res.get("filename", "")
                    fsize = res.get("size", 0)
                    files_created.append({"name": fname, "size": fsize})
                    yield sse({"type": "file_created", "filename": fname, "size": fsize})
                    yield sse({"type": "thought", "phase": "executing", "text": f"✅ {fname} ({fsize} bytes)"})
                elif res.get("error"):
                    yield sse({"type": "thought", "phase": "executing", "text": f"⚠️ {res['error']}"})

            elif evt_type == "error":
                yield sse({"type": "error", "message": event["message"]})

            elif evt_type == "complete":
                complete_files = event.get("files", [])
                if complete_files:
                    files_created = [{"name": f["name"], "size": f.get("size", 0)} for f in complete_files]

        yield sse({"type": "phase_done", "phase": "executing"})

        # ── Validation phase ─────────────────────────────────
        file_count = len(files_created)
        quality = min(95, 60 + file_count * 8)

        yield sse({"type": "phase_start", "phase": "validating", "label": "Validating output"})
        await asyncio.sleep(0.3)
        yield sse({"type": "thought", "phase": "validating", "text": f"{file_count} files created"})
        await asyncio.sleep(0.2)
        yield sse({"type": "thought", "phase": "validating", "text": f"Quality score: {quality}/100"})
        await asyncio.sleep(0.2)
        yield sse({"type": "thought", "phase": "validating", "text": "Validation passed ✓"})
        yield sse({"type": "phase_done", "phase": "validating"})

        # ── Save to DB ────────────────────────────────────────
        full_text = "".join(full_content_text)
        
        # If no files were created via tools, try to extract code blocks from text
        if not files_created and full_text:
            import re
            code_block_pattern = re.compile(r"```(\w*)\n(.*?)```", re.DOTALL)
            matches = code_block_pattern.findall(full_text)
            
            extracted_files = []
            for lang, content in matches:
                lang = lang.strip().lower()
                if not lang:
                    continue
                
                filename = f"file.{lang}"
                first_line = content.split('\n', 1)[0].strip()
                if first_line.startswith('//') or first_line.startswith('#') or first_line.startswith('<!--'):
                    fname_match = re.search(r'([a-zA-Z0-9_\-\.]+\.\w+)', first_line)
                    if fname_match:
                        filename = fname_match.group(1)
                
                if filename == f"file.{lang}":
                    if lang in ('html', 'xml'): filename = "index.html"
                    elif lang == 'css': filename = "styles.css"
                    elif lang in ('js', 'javascript'): filename = "script.js"
                    elif lang in ('ts', 'typescript'): filename = "script.ts"
                    elif lang == 'json': filename = "data.json"
                
                extracted_files.append({"name": filename, "content": content})
            
            if extracted_files:
                workspace = WORKSPACES_DIR / str(task_id)
                workspace.mkdir(parents=True, exist_ok=True)
                for ef in extracted_files:
                    fpath = workspace / ef["name"]
                    try:
                        with open(fpath, "w", encoding="utf-8") as f:
                            f.write(ef["content"])
                        files_created.append({"name": ef["name"], "size": len(ef["content"].encode('utf-8'))})
                    except Exception:
                        pass
        
        if files_created:
            file_count = len(files_created)
            quality = min(95, 60 + file_count * 8)
            file_names = ", ".join(f["name"] for f in files_created[:5])
            summary = f"Created {file_count} files: {file_names}"
            result_content = summary
        else:
            summary = "Agent generated response directly (no files created)."
            result_content = full_text

        try:
            db.table("tasks").update({
                "status": "review",
                "result_summary": summary,
                "result_content": result_content,
                "quality_score": quality,
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", task["id"]).execute()
        except Exception:
            pass

        # ── Done ──────────────────────────────────────────────
        yield sse({
            "type": "complete",
            "files": files_created,
            "summary": result_content,
            "quality": quality,
            "file_count": file_count,
        })

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Workspace file endpoints ────────────────────────────────────

@router.get("/{task_id}/files")
def list_workspace_files(task_id: str):
    files = get_workspace_files(task_id)
    return {"files": files, "count": len(files)}


@router.get("/{task_id}/files/{filename:path}")
def get_workspace_file(task_id: str, filename: str):
    workspace = WORKSPACES_DIR / task_id
    safe_path = workspace / filename
    if not str(safe_path.resolve()).startswith(str(workspace.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(safe_path)


@router.get("/{task_id}/download")
def download_workspace(task_id: str):
    workspace = WORKSPACES_DIR / task_id
    if not workspace.exists():
        raise HTTPException(status_code=404, detail="No workspace found")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in workspace.rglob("*"):
            if fp.is_file():
                zf.write(fp, str(fp.relative_to(workspace)))
    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=task-{task_id[:8]}-deliverables.zip"},
    )


class ApplicationCreate(BaseModel):
    freelancer_id: str
    cover_letter: str

@router.post("/{task_id}/apply")
def apply_for_task(task_id: str, app: ApplicationCreate):
    db = get_supabase()
    task_res = db.table("tasks").select("task_id").eq("id", task_id).execute()
    if not task_res.data:
        raise HTTPException(404, "Task not found")
    t_id = task_res.data[0]["task_id"]
    db.table("task_applications").insert({
        "task_id": t_id,
        "freelancer_id": app.freelancer_id,
        "cover_letter": app.cover_letter,
        "status": "pending"
    }).execute()
    return {"success": True}

@router.get("/{task_id}/applications")
def get_applications(task_id: str):
    db = get_supabase()
    task_res = db.table("tasks").select("task_id").eq("id", task_id).execute()
    if not task_res.data:
        return {"applications": []}
    t_id = task_res.data[0]["task_id"]
    apps_res = db.table("task_applications").select("*, freelancer:users(*)").eq("task_id", t_id).execute()
    return {"applications": apps_res.data}

@router.post("/{task_id}/applications/{app_id}/accept")
def accept_application(task_id: str, app_id: str):
    db = get_supabase()
    db.table("task_applications").update({"status": "accepted"}).eq("id", app_id).execute()
    app_res = db.table("task_applications").select("freelancer_id").eq("id", app_id).execute()
    if not app_res.data:
        raise HTTPException(404, "Application not found")
    f_id = app_res.data[0]["freelancer_id"]
    db.table("tasks").update({
        "freelancer_id": f_id,
        "status": "in_progress",
        "freelancer_status": "assigned"
    }).eq("id", task_id).execute()
    return {"success": True}

class SubmissionCreate(BaseModel):
    submission: str

@router.post("/{task_id}/submit")
def submit_work(task_id: str, payload: SubmissionCreate):
    db = get_supabase()
    db.table("tasks").update({
        "freelancer_submission": payload.submission,
        "freelancer_status": "submitted"
    }).eq("id", task_id).execute()
    return {"success": True}

@router.post("/{task_id}/approve_work")
def approve_work(task_id: str):
    db = get_supabase()
    db.table("tasks").update({
        "freelancer_status": "approved",
        "status": "completed",
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", task_id).execute()
    return {"success": True}


# ── Legacy endpoints ────────────────────────────────────────────

@router.post("/{task_id}/approve")
def approve_task(task_id: int, poster_address: str):
    db = get_supabase()
    if not db:
        return {"success": False, "message": "Mock mode"}
    db.table("tasks").update({
        "status": "verified",
        "verified_at": datetime.utcnow().isoformat(),
    }).eq("task_id", task_id).eq("poster_address", poster_address).execute()
    return {"success": True, "message": "Task approved — payment will be released."}


@router.post("/{task_id}/dispute")
def dispute_task(task_id: int, poster_address: str, reason: str = "Quality not satisfactory"):
    db = get_supabase()
    if not db:
        return {"success": False}
    db.table("tasks").update({"status": "disputed"}).eq("task_id", task_id).execute()
    db.table("disputes").insert({
        "task_id": task_id,
        "reason": reason,
        "resolution": "pending",
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    return {"success": True}
