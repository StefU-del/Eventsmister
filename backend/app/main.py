import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine, migrate_legacy_schema
from app.routers import auth, comments, likes, posts, uploads, users

migrate_legacy_schema()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Eventsmister App",
    description="A social media platform for discovering and discussing London events",
    version="1.0.0",
)

default_frontend_origins = (
    "http://localhost:5173,http://127.0.0.1:5173"
)
frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", default_frontend_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Apply API-safe browser protections without changing response bodies."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(users.router)
app.include_router(uploads.router)


@app.get("/")
def root():
    return {"message": "Welcome to the Eventsmister API"}
