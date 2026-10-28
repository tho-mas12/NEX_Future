from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.routers import (
    auth,
    onboarding,
    dashboard,
    study,
    admin,
    settings as platform_settings,
    revision,
    analysis,
    student_features,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    try:
        await init_db()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization exception (DB might still be connecting): {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API for NEX - The 180-Day SSC Mastery Platform",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(onboarding.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(study.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(platform_settings.router, prefix=settings.API_V1_STR)
app.include_router(revision.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(student_features.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ExamRail API"}
