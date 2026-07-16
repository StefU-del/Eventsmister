import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

from app import dependencies
from app.database import migrate_legacy_schema
from tests.database_setup import client


def test_get_db_closes_the_session(monkeypatch):
    class FakeSession:
        closed = False

        def close(self):
            self.closed = True

    session = FakeSession()
    monkeypatch.setattr(dependencies, "SessionLocal", lambda: session)

    database_dependency = dependencies.get_db()

    assert next(database_dependency) is session

    database_dependency.close()

    assert session.closed is True


def test_auth_requires_a_secret_key(tmp_path):
    environment = os.environ.copy()
    environment.pop("SECRET_KEY", None)
    environment["PYTHONPATH"] = str(Path(__file__).resolve().parents[1])

    result = subprocess.run(
        [sys.executable, "-c", "import app.auth"],
        cwd=tmp_path,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "SECRET_KEY must be set in the environment." in result.stderr


def test_cors_allows_the_local_frontend():
    response = client.options(
        "/posts/",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_an_unlisted_origin():
    response = client.options(
        "/posts/",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_legacy_post_description_column_is_migrated(tmp_path):
    database_engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")

    with database_engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE posts ("
                "id INTEGER PRIMARY KEY, "
                "desciption TEXT NOT NULL"
                ")"
            )
        )

    migrate_legacy_schema(database_engine)

    column_names = {
        column["name"] for column in inspect(database_engine).get_columns("posts")
    }

    assert "description" in column_names
    assert "desciption" not in column_names
