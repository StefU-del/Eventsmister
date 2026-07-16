from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{BACKEND_DIRECTORY / 'eventsmister.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def migrate_legacy_schema(database_engine: Engine = engine) -> None:
    inspector = inspect(database_engine)

    if "posts" not in inspector.get_table_names():
        return

    column_names = {
        column["name"] for column in inspector.get_columns("posts")
    }

    if "desciption" in column_names and "description" not in column_names:
        with database_engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE posts RENAME COLUMN desciption TO description")
            )
