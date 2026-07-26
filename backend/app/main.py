from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import init_db
from .routes.health import router as health_router
from .routes.leads import router as leads_router
from .routes.workflow import router as workflow_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    init_db()
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title="n8n Lead Magnet Funnel Backend API",
        description="FastAPI Backend for n8n Webhook Integration & Lead Capture System",
        version="1.0.0",
        lifespan=lifespan
    )

    # Enable CORS for localhost:3000 and any origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routes
    app.include_router(health_router, prefix="/api")
    app.include_router(leads_router, prefix="/api")
    app.include_router(workflow_router, prefix="/api")

    @app.get("/")
    def index():
        return {
            "title": "n8n Lead Magnet API",
            "status": "running",
            "docs": "/docs",
            "endpoints": [
                "/api/health",
                "/api/leads/submit",
                "/api/leads",
                "/api/workflow"
            ]
        }

    return app

app = create_app()
