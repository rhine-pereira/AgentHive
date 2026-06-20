from abc import ABC, abstractmethod
from typing import Dict, Any
import hashlib, json
from datetime import datetime
from services.supabase_client import get_supabase


class BaseAgent(ABC):
    """Base class for all AgentHive AI agents."""

    def __init__(self, agent_id: int, agent_type: str, name: str):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.name = name
        self.db = get_supabase()

    async def discover_tasks(self) -> list:
        """Find open tasks matching this agent's specialization."""
        if not self.db:
            return []
        result = (
            self.db.table("tasks")
            .select("*")
            .eq("status", "open")
            .eq("task_type", self.agent_type)
            .order("bounty_amount", desc=True)
            .limit(10)
            .execute()
        )
        return result.data or []

    async def accept_task(self, task_id: int):
        if not self.db:
            return
        self.db.table("tasks").update({
            "status": "in_progress",
            "assigned_agent_id": self.agent_id,
            "accepted_at": datetime.utcnow().isoformat(),
        }).eq("task_id", task_id).execute()
        self.db.table("agents").update({"status": "working"}).eq("agent_id", self.agent_id).execute()
        self._log("task_accepted", task_id)

    @abstractmethod
    async def execute(self, task: dict) -> Dict[str, Any]:
        """Execute the task. Must return {output: str, summary: str, quality_estimate: int}"""
        pass

    async def submit_result(self, task_id: int, result: Dict[str, Any]) -> str:
        result_hash = hashlib.sha256(json.dumps(result["output"]).encode()).hexdigest()
        if self.db:
            self.db.table("tasks").update({
                "status": "completed",
                "result_content": result["output"],
                "result_summary": result["summary"],
                "result_hash": result_hash,
                "quality_score": result.get("quality_estimate", 75),
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("task_id", task_id).execute()
            self.db.table("agents").update({"status": "idle"}).eq("agent_id", self.agent_id).execute()
            self._log("task_completed", task_id, {"result_hash": result_hash, "summary": result["summary"]})
        return result_hash

    async def run_cycle(self):
        """Full cycle: discover → accept → execute → submit."""
        tasks = await self.discover_tasks()
        for task in tasks:
            tid = task["task_id"]
            self._log("agent_working", tid, {"message": f"{self.name} starting task #{tid}"})
            await self.accept_task(tid)
            try:
                result = await self.execute(task)
                await self.submit_result(tid, result)
                self._update_reputation(tid, result.get("quality_estimate", 75))
                return True
            except Exception as e:
                self._handle_failure(tid, str(e))
                return False
        return False

    def _log(self, event: str, task_id: int = None, details: dict = None):
        if not self.db:
            return
        self.db.table("activity_log").insert({
            "event_type": event,
            "agent_id": self.agent_id,
            "task_id": task_id,
            "details": details or {},
        }).execute()

    def _update_reputation(self, task_id: int, quality: int):
        if not self.db:
            return
        agent = self.db.table("agents").select("*").eq("agent_id", self.agent_id).single().execute().data
        new_score = agent["reputation_score"] + quality
        new_completed = agent["tasks_completed"] + 1
        streak = agent["streak_count"] + 1
        badges = [(15000, "diamond"), (5000, "platinum"), (1500, "gold"), (500, "silver"), (100, "bronze")]
        badge = next((b for t, b in badges if new_score >= t), "none")
        self.db.table("agents").update({
            "reputation_score": new_score,
            "tasks_completed": new_completed,
            "streak_count": streak,
            "best_streak": max(streak, agent["best_streak"]),
            "badge": badge,
        }).eq("agent_id", self.agent_id).execute()
        self.db.table("reputation_log").insert({
            "agent_id": self.agent_id, "task_id": task_id,
            "event_type": "task_completed", "quality_score": quality,
            "points_earned": quality, "new_total": new_score, "new_badge": badge,
        }).execute()

    def _handle_failure(self, task_id: int, error: str):
        if not self.db:
            return
        self.db.table("tasks").update({
            "status": "open", "assigned_agent_id": None, "accepted_at": None,
        }).eq("task_id", task_id).execute()
        self.db.table("agents").update({"status": "idle"}).eq("agent_id", self.agent_id).execute()
        self._log("task_failed", task_id, {"error": error})
