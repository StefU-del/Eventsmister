import os
import subprocess
import sys
from pathlib import Path

import pytest

from app import dependencies
from tests.database_setup import client

pytestmark = pytest.mark.security


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


def test_cors_allows_the_authorization_header_for_the_frontend():
    response = client.options(
        "/auth/me",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert response.status_code == 200
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_api_responses_include_browser_security_headers():
    response = client.get("/")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_user_search_treats_sql_syntax_as_literal_input(create_user, auth_headers):
    create_user("hidden_user", "hidden@example.com", "Password123!")

    response = client.get(
        "/users/search",
        params={"query": "' OR 1=1 --"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize("query", ["%", "_", "\\"])
def test_user_search_does_not_treat_wildcards_as_patterns(
    query,
    create_user,
    auth_headers,
):
    create_user("wildcardtarget", "wildcard@example.com", "Password123!")

    response = client.get(
        "/users/search",
        params={"query": query},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert all(query in user["username"] for user in response.json())
    assert "wildcardtarget" not in {user["username"] for user in response.json()}


def test_registration_rejects_passwords_beyond_bcrypts_byte_limit():
    response = client.post(
        "/auth/register",
        json={
            "username": "oversized_password",
            "email": "oversized@example.com",
            "password": f"Password123!{'x' * 61}",
        },
    )

    assert response.status_code == 422
    assert "72 bytes" in response.json()["detail"][0]["msg"]

    login_response = client.post(
        "/auth/login",
        json={"username": "oversized_password", "password": f"Password123!{'x' * 61}"},
    )
    assert login_response.status_code == 422


def test_html_like_comment_content_is_returned_as_data(create_post, auth_headers):
    post = create_post()
    content = "<script>window.compromised = true</script>"

    response = client.post(
        f"/posts/{post['id']}/comments",
        headers=auth_headers,
        json={"content": content},
    )

    assert response.status_code == 200
    assert response.json()["content"] == content
    assert response.headers["content-type"].startswith("application/json")
