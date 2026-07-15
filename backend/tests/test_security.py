import os
import subprocess
import sys
from pathlib import Path

from app import dependencies


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
