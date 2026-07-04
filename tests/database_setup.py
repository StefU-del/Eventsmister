from sqlalchemy import create_engine;
from sqlalchemy.orm import sessionmaker;
from app.database import Base;
from app.dependencies import get_db;
from app.main import app;
from sqlalchemy.pool import StaticPool;

from fastapi.testclient import TestClient;

DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread":False},
    poolclass=StaticPool,
);

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
);

def test_db():
    db = TestingSessionLocal();
    try:
        yield db;
    finally:
        db.close();

Base.metadata.create_all(bind=engine);
app.dependency_overrides[get_db] = test_db;

client = TestClient(app);




