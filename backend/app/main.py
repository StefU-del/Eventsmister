import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine, migrate_legacy_schema
from app.routers import auth, posts, comments, likes, users

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
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Welcome to the Eventsmister API"}
