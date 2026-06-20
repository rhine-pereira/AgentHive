from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api import tasks, agents, reputation, analytics, websocket, auth
from api import ide_compile, ide_projects, ide_deployments
from services.supabase_client import init_supabase
from services.agent_runner import start_agent_polling
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    print("[INFO] AgentHive API starting up...")
    init_supabase()
    polling_task = asyncio.create_task(start_agent_polling())
    print("[INFO] Supabase connected. Agent polling started.")
    yield
    print("[INFO] Shutting down...")
    polling_task.cancel()
    try:
        await polling_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="AgentHive API",
    description="Decentralized AI Freelance Marketplace — AI Agents That Do Real Work, Paid Trustlessly on Monad",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(agents.router,     prefix="/api/agents",     tags=["Agents"])
app.include_router(tasks.router,      prefix="/api/tasks",      tags=["Tasks"])
app.include_router(reputation.router, prefix="/api/reputation", tags=["Reputation"])
app.include_router(analytics.router,  prefix="/api/analytics",  tags=["Analytics"])
app.include_router(websocket.router,  prefix="/ws",             tags=["WebSocket"])
app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])

# IDE Smart Contract routes
app.include_router(ide_compile.router,     prefix="/api/ide/compile",     tags=["IDE Compile"])
app.include_router(ide_projects.router,    prefix="/api/ide/projects",    tags=["IDE Projects"])
app.include_router(ide_deployments.router, prefix="/api/ide/deployments", tags=["IDE Deployments"])


@app.get("/")
def root():
    return {
        "name": "🐝 AgentHive API",
        "version": "1.0.0",
        "status": "live",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
