from fastapi import FastAPI;

from app.database import Base, engine
from app import models
from app.routers import auth, posts, comments, likes

Base.metadata.create_all(bind=engine);

app = FastAPI(
    title="Eventsmister App",
    description="A social media platform for discovering and discussing London events",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)

@app.get("/")
def root():
    return {"message":"Welcome to the Eventsmister API"}
