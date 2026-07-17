import pytest
from sqlalchemy import create_engine, inspect, text

from app.database import migrate_legacy_schema

pytestmark = pytest.mark.database


def test_legacy_post_description_column_is_migrated(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with database_engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE posts (id INTEGER PRIMARY KEY, desciption TEXT NOT NULL)")
        )

    migrate_legacy_schema(database_engine)

    column_names = {
        column["name"] for column in inspect(database_engine).get_columns("posts")
    }
    assert "description" in column_names
    assert "desciption" not in column_names
    database_engine.dispose()


def test_legacy_like_tables_receive_unique_and_query_indexes(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy-likes.db'}")
    with database_engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE likes (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, "
                "post_id INTEGER, comment_id INTEGER)"
            )
        )

    migrate_legacy_schema(database_engine)

    index_names = {
        index["name"] for index in inspect(database_engine).get_indexes("likes")
    }
    assert {
        "uq_likes_owner_post_index",
        "uq_likes_owner_comment_index",
        "ix_likes_owner_id",
        "ix_likes_post_id",
        "ix_likes_comment_id",
    }.issubset(index_names)
    database_engine.dispose()


def test_legacy_social_tables_receive_query_indexes(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy-social.db'}")
    with database_engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE posts (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL)")
        )
        connection.execute(
            text(
                "CREATE TABLE comments (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, "
                "post_id INTEGER NOT NULL)"
            )
        )

    migrate_legacy_schema(database_engine)
    inspector = inspect(database_engine)

    assert "ix_posts_owner_id" in {
        index["name"] for index in inspector.get_indexes("posts")
    }
    assert {"ix_comments_owner_id", "ix_comments_post_id"}.issubset(
        {index["name"] for index in inspector.get_indexes("comments")}
    )
    database_engine.dispose()


def test_legacy_tables_receive_profile_and_discovery_columns(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy-features.db'}")
    with database_engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE users (id INTEGER PRIMARY KEY, username VARCHAR(30))")
        )
        connection.execute(
            text(
                "CREATE TABLE posts (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, "
                "description TEXT)"
            )
        )

    migrate_legacy_schema(database_engine)
    inspector = inspect(database_engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    post_columns = {column["name"] for column in inspector.get_columns("posts")}

    assert {"date_of_birth", "interests", "profile_photo_url"}.issubset(user_columns)
    assert {"image_url", "hashtags"}.issubset(post_columns)
    database_engine.dispose()


def test_legacy_sport_category_is_renamed_to_sports(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy-category.db'}")
    with database_engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE posts (id INTEGER PRIMARY KEY, category VARCHAR(50))")
        )
        connection.execute(text("INSERT INTO posts (id, category) VALUES (1, 'Sport')"))
        connection.execute(text("INSERT INTO posts (id, category) VALUES (2, 'Music')"))

    migrate_legacy_schema(database_engine)

    with database_engine.connect() as connection:
        categories = connection.execute(
            text("SELECT category FROM posts ORDER BY id")
        ).scalars().all()

    assert categories == ["Sports", "Music"]
    database_engine.dispose()
