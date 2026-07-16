from uuid import uuid4

import pytest

from tests.database_setup import client

pytestmark = pytest.mark.api


def test_create_comment_requires_authentication(create_post):
    post = create_post()

    response = client.post(
        f"/posts/{post['id']}/comments",
        json={
            "content": "This comment should fail because I am not logged in.",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_authenticated_user_can_create_comment(create_post, auth_headers):
    post = create_post()

    response = client.post(
        f"/posts/{post['id']}/comments",
        headers=auth_headers,
        json={
            "content": "This is a useful comment.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["content"] == "This is a useful comment."
    assert data["post_id"] == post["id"]
    assert "owner_id" in data
    assert data["owner"]["id"] == data["owner_id"]
    assert data["like_count"] == 0


def test_get_comments_for_post(create_post, create_comment):
    post = create_post()

    comment = create_comment(
        post_id=post["id"],
        content="Looking forward to this event.",
    )

    response = client.get(f"/posts/{post['id']}/comments")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["id"] == comment["id"]
    assert data[0]["content"] == "Looking forward to this event."


def test_user_can_delete_own_comment(create_post, create_comment, auth_headers):
    post = create_post()

    comment = create_comment(
        post_id=post["id"],
        content="This comment will be deleted.",
    )

    response = client.delete(
        f"/comments/{comment['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Comment deleted successfully"


def test_user_cannot_delete_someone_elses_comment(
    create_post,
    create_comment,
    create_user,
    login_user,
):
    post = create_post()

    comment = create_comment(
        post_id=post["id"],
        content="This belongs to another user.",
    )

    unique_id = uuid4().hex[:8]

    other_username = f"comment_other_user_{unique_id}"
    other_email = f"comment_other_user_{unique_id}@example.com"
    password = "Password123!"

    create_user(
        username=other_username,
        email=other_email,
        password=password,
    )

    other_token = login_user(
        username=other_username,
        password=password,
    )

    other_headers = {
        "Authorization": f"Bearer {other_token}",
    }

    response = client.delete(
        f"/comments/{comment['id']}",
        headers=other_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You can only delete your own comments"


def test_cannot_create_comment_for_missing_post(auth_headers):
    response = client.post(
        "/posts/999999/comments",
        headers=auth_headers,
        json={"content": "This post does not exist."},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


def test_get_comments_for_missing_post_returns_404():
    response = client.get("/posts/999999/comments")

    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


def test_delete_missing_comment_returns_404(auth_headers):
    response = client.delete("/comments/999999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Comment not found"
