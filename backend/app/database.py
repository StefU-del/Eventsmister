import os
from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_URL = f"sqlite:///{BACKEND_DIRECTORY / 'eventsmister.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)


def enable_sqlite_foreign_keys(database_engine: Engine) -> None:
    """Make SQLite enforce the foreign-key relationships declared by the models."""
    if database_engine.url.get_backend_name() != "sqlite":
        return

    @event.listens_for(database_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


enable_sqlite_foreign_keys(engine)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def migrate_legacy_schema(database_engine: Engine = engine) -> None:
    inspector = inspect(database_engine)
    table_names = set(inspector.get_table_names())

    with database_engine.begin() as connection:
        if "users" in table_names:
            user_column_names = {
                column["name"] for column in inspector.get_columns("users")
            }
            user_columns = {
                "date_of_birth": "DATE",
                "interests": "JSON NOT NULL DEFAULT '[]'",
                "profile_photo_url": "VARCHAR(500)",
            }
            for column_name, column_definition in user_columns.items():
                if column_name not in user_column_names:
                    connection.execute(
                        text(
                            f"ALTER TABLE users ADD COLUMN {column_name} "
                            f"{column_definition}"
                        )
                    )

        if "posts" in table_names:
            column_names = {
                column["name"] for column in inspector.get_columns("posts")
            }

            if "desciption" in column_names and "description" not in column_names:
                connection.execute(
                    text("ALTER TABLE posts RENAME COLUMN desciption TO description")
                )

            post_columns = {
                "image_url": "VARCHAR(500)",
                "hashtags": "JSON NOT NULL DEFAULT '[]'",
            }
            for column_name, column_definition in post_columns.items():
                if column_name not in column_names:
                    connection.execute(
                        text(
                            f"ALTER TABLE posts ADD COLUMN {column_name} "
                            f"{column_definition}"
                        )
                    )

            if "category" in column_names:
                # Keep records created with the old singular UI label consistent.
                connection.execute(
                    text(
                        "UPDATE posts SET category = 'Sports' "
                        "WHERE lower(trim(category)) = 'sport'"
                    )
                )

            if "owner_id" in column_names:
                connection.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_posts_owner_id "
                        "ON posts (owner_id)"
                    )
                )

        if "comments" in table_names:
            comment_column_names = {
                column["name"] for column in inspector.get_columns("comments")
            }
            for column_name in ("owner_id", "post_id"):
                if column_name not in comment_column_names:
                    continue
                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_comments_{column_name} "
                        f"ON comments ({column_name})"
                    )
                )

        if "likes" in table_names:
            # Partial indexes also protect databases created before the ORM constraints existed.
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_likes_owner_post_index "
                    "ON likes (owner_id, post_id) WHERE post_id IS NOT NULL"
                )
            )
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_likes_owner_comment_index "
                    "ON likes (owner_id, comment_id) WHERE comment_id IS NOT NULL"
                )
            )
            like_column_names = {
                column["name"] for column in inspector.get_columns("likes")
            }
            for column_name in ("owner_id", "post_id", "comment_id"):
                if column_name not in like_column_names:
                    continue
                connection.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_likes_{column_name} "
                        f"ON likes ({column_name})"
                    )
                )
