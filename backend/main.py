import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api.runs import router as runs_router
from app.api.agents import router as agents_router
from app.api.projects import router as projects_router
from app.api.settings import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("polyman")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Polyman Database...")
    await init_db()
    logger.info("Polyman Engine Ready!")
    yield
    logger.info("Polyman shutting down.")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# CORS middleware for local frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(runs_router)
app.include_router(agents_router)
app.include_router(projects_router)
app.include_router(settings_router)

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "workspace": settings.workspace_dir
    }

# Serve the Vite frontend from the same serverless function as the API.
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
