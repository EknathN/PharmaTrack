from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .core.config import settings

# Routers & Services
from .routers import auth, batches, shipments, disposal
from .services.expiry_checker import start_scheduler

# Create database tables (using Alembic in production, but this works for sqlite dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def on_startup():
    start_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to PharmaTrack API"}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(batches.router, prefix="/api/batches", tags=["batches"])
app.include_router(shipments.router, prefix="/api/shipments", tags=["shipments"])
app.include_router(disposal.router, prefix="/api/disposal", tags=["disposal"])
