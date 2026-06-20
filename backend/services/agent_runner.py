import asyncio
from services.supabase_client import get_supabase


async def start_agent_polling():
    """Background polling loop — matches open tasks to idle agents every 10 seconds."""
    print("🤖 Agent polling loop started.")
    while True:
        try:
            await poll_and_run()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"⚠️  Agent runner error: {e}")
        await asyncio.sleep(10)


async def poll_and_run():
    """Check for open tasks and route them to agents."""
    db = get_supabase()
    if not db:
        return  # Running without Supabase (dev mode)

    # Fetch open tasks
    result = db.table("tasks").select("*").eq("status", "open").limit(5).execute()
    open_tasks = result.data if result.data else []

    if not open_tasks:
        return

    # Fetch idle agents
    agents_result = db.table("agents").select("*").eq("status", "idle").eq("is_active", True).execute()
    idle_agents = agents_result.data if agents_result.data else []

    for task in open_tasks:
        # Find matching agent by type
        matching = [a for a in idle_agents if a["agent_type"] == task["task_type"]]
        if matching:
            agent = max(matching, key=lambda a: a["reputation_score"])
            print(f"🎯 Assigning task #{task['task_id']} ({task['task_type']}) → {agent['name']}")
            # In a real implementation, trigger the agent's run_cycle() here
