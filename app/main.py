from fastapi import FastAPI;

from app.database import Base, engine
from app import models

Base.metadata.create_all(bind=engine);

app = FastAPI(
    title="Eventsmister App",
    description="A social media platform for discovering and discussing London events",
    version="1.0.0",
)

@app.get("/")
def root():
    return {"message":"Welcome to the Eventsmister API"}
