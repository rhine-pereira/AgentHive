"""
AgentHive Tool System — Tools the AI agent can call during task execution.
Each tool creates real files in a workspace directory.
"""

import os
import json
from pathlib import Path
from typing import Any

# Base workspace directory
WORKSPACES_DIR = Path(__file__).parent.parent / "workspaces"


def ensure_workspace(task_id: str) -> Path:
    workspace = WORKSPACES_DIR / task_id
    workspace.mkdir(parents=True, exist_ok=True)
    return workspace


# ── Tool Definitions (OpenAI format) ────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_file",
            "description": "Create a new file in the project workspace with the given content. Use this to produce deliverables like HTML, CSS, JS, Python files, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The file path relative to the project root, e.g. 'index.html', 'src/styles.css', 'app.py'"
                    },
                    "content": {
                        "type": "string",
                        "description": "The complete file content to write"
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of what this file does"
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Edit an existing file by replacing its entire content. Use when you need to update a file you already created.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The file path to edit"
                    },
                    "content": {
                        "type": "string",
                        "description": "The new complete file content"
                    },
                    "description": {
                        "type": "string",
                        "description": "What changed in this edit"
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List all files currently in the project workspace.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read the content of a file in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The file path to read"
                    }
                },
                "required": ["filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "task_complete",
            "description": "Signal that the task is complete and all deliverables have been created. Call this when you're done.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Brief summary of what was created"
                    }
                },
                "required": ["summary"]
            }
        }
    },
]


# ── Tool Execution ──────────────────────────────────────────────

def execute_tool(tool_name: str, args: dict, task_id: str) -> dict[str, Any]:
    workspace = ensure_workspace(task_id)

    if tool_name == "create_file":
        return _create_file(workspace, args)
    elif tool_name == "edit_file":
        return _edit_file(workspace, args)
    elif tool_name == "list_files":
        return _list_files(workspace)
    elif tool_name == "read_file":
        return _read_file(workspace, args)
    elif tool_name == "task_complete":
        return {"status": "complete", "summary": args.get("summary", "")}
    else:
        return {"error": f"Unknown tool: {tool_name}"}


def _create_file(workspace: Path, args: dict) -> dict:
    filename = args.get("filename", "")
    content = args.get("content", "")
    desc = args.get("description", "")

    if not filename:
        return {"error": "filename is required"}

    # Prevent path traversal
    safe_path = workspace / filename.lstrip("/\\")
    if not str(safe_path.resolve()).startswith(str(workspace.resolve())):
        return {"error": "Invalid file path"}

    safe_path.parent.mkdir(parents=True, exist_ok=True)
    safe_path.write_text(content, encoding="utf-8")

    return {
        "status": "created",
        "filename": filename,
        "size": len(content),
        "description": desc,
    }


def _edit_file(workspace: Path, args: dict) -> dict:
    filename = args.get("filename", "")
    content = args.get("content", "")

    safe_path = workspace / filename.lstrip("/\\")
    if not str(safe_path.resolve()).startswith(str(workspace.resolve())):
        return {"error": "Invalid file path"}

    if not safe_path.exists():
        return {"error": f"File not found: {filename}"}

    safe_path.write_text(content, encoding="utf-8")
    return {"status": "updated", "filename": filename, "size": len(content)}


def _list_files(workspace: Path) -> dict:
    files = []
    for p in workspace.rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(workspace)).replace("\\", "/")
            files.append({"name": rel, "size": p.stat().st_size})
    return {"files": files, "count": len(files)}


def _read_file(workspace: Path, args: dict) -> dict:
    filename = args.get("filename", "")
    safe_path = workspace / filename.lstrip("/\\")

    if not str(safe_path.resolve()).startswith(str(workspace.resolve())):
        return {"error": "Invalid file path"}
    if not safe_path.exists():
        return {"error": f"File not found: {filename}"}

    content = safe_path.read_text(encoding="utf-8")
    return {"filename": filename, "content": content, "size": len(content)}


def get_workspace_files(task_id: str) -> list[dict]:
    workspace = WORKSPACES_DIR / task_id
    if not workspace.exists():
        return []
    files = []
    for p in workspace.rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(workspace)).replace("\\", "/")
            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                content = "(binary file)"
            files.append({"name": rel, "size": p.stat().st_size, "content": content})
    return files
