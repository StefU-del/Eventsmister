from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app import models
from app.auth import ALGORITHM, SECRET_KEY, create_access_token
from tests.database_setup import TestingSessionLocal, client

pytestmark = [pytest.mark.api, pytest.mark.auth, pytest.mark.security]


def test_access_token_has_an_expiry_without_mutating_the_input():
    claims = {"sub": "token_user"}
    token = create_access_token(claims)
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert claims == {"sub": "token_user"}
    assert decoded["sub"] == "token_user"
    assert decoded["exp"] > datetime.now(timezone.utc).timestamp()


def test_expired_token_is_rejected_with_a_bearer_challenge(create_user):
    create_user("expired_user", "expired@example.com", "Password123!")
    token = jwt.encode(
        {
            "sub": "expired_user",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Token"
    assert response.headers["www-authenticate"] == "Bearer"


def test_tampered_token_is_rejected(create_user, login_user):
    create_user("tampered_user", "tampered@example.com", "Password123!")
    token = login_user("tampered_user", "Password123!")
    header, payload, signature = token.split(".")
    replacement = "a" if signature[0] != "a" else "b"
    tampered_token = f"{header}.{payload}.{replacement}{signature[1:]}"

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Token"


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("GET", "/auth/me", None),
        ("GET", "/auth/me/likes", None),
        ("GET", "/auth/me/liked-posts", None),
        ("PATCH", "/auth/me", {"interests": ["music"]}),
        ("GET", "/users/search?query=user", None),
        ("POST", "/posts/1/like", None),
        ("POST", "/posts/1/comments", {"content": "Unauthorised"}),
        ("DELETE", "/posts/1", None),
    ],
)
def test_protected_endpoints_reject_anonymous_requests(method, path, payload):
    response = client.request(method, path, json=payload)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_user_cannot_delete_another_users_post_or_comment(
    create_user,
    login_user,
    auth_headers,
    create_post,
    create_comment,
):
    post = create_post()
    comment = create_comment(post["id"])
    create_user("intruder", "intruder@example.com", "Password123!")
    intruder_headers = {
        "Authorization": f"Bearer {login_user('intruder', 'Password123!')}"
    }

    post_response = client.delete(
        f"/posts/{post['id']}", headers=intruder_headers
    )
    comment_response = client.delete(
        f"/comments/{comment['id']}", headers=intruder_headers
    )

    assert post_response.status_code == 403
    assert post_response.json()["detail"] == "You can only delete your own posts"
    assert comment_response.status_code == 403
    assert comment_response.json()["detail"] == "You can only delete your own comments"

    # The owner still has access after the rejected operations.
    assert client.get(f"/posts/{post['id']}").status_code == 200
    assert client.delete(f"/comments/{comment['id']}", headers=auth_headers).status_code == 200


def test_registration_hashes_the_password_and_never_returns_it():
    response = client.post(
        "/auth/register",
        json={
            "username": "password_owner",
            "email": "password_owner@example.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 200
    assert "password" not in response.json()
    assert "hashed_password" not in response.json()

    with TestingSessionLocal() as session:
        user = session.query(models.User).filter_by(username="password_owner").one()
        assert user.hashed_password != "Password123!"
        assert user.hashed_password.startswith("$2")
