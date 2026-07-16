from uuid import uuid4

import pytest

from app.routers import uploads
from tests.database_setup import client

PNG_CONTENT = b"\x89PNG\r\n\x1a\n" + b"integration-image"


def register_and_login(prefix: str):
    unique_id = uuid4().hex[:6]
    username = f"{prefix}_{unique_id}"
    password = "Password123!"
    register_response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
        },
    )
    assert register_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200

    return register_response.json(), {
        "Authorization": f"Bearer {login_response.json()['access_token']}"
    }


@pytest.mark.integration
def test_complete_two_user_social_workflow(tmp_path, monkeypatch):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)
    host, host_headers = register_and_login("host")
    guest, guest_headers = register_and_login("guest")

    profile_upload_response = client.post(
        "/uploads/images",
        headers=host_headers,
        files={"file": ("host-profile.png", PNG_CONTENT, "image/png")},
    )
    event_upload_response = client.post(
        "/uploads/images",
        headers=host_headers,
        files={"file": ("event.png", PNG_CONTENT, "image/png")},
    )
    assert profile_upload_response.status_code == 200
    assert event_upload_response.status_code == 200
    profile_image_url = profile_upload_response.json()["url"]
    event_image_url = event_upload_response.json()["url"]

    profile_response = client.patch(
        "/auth/me",
        headers=host_headers,
        json={
            "date_of_birth": "1994-03-12",
            "interests": ["Community", "live music", "community"],
            "profile_photo_url": profile_image_url,
        },
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["date_of_birth"] == "1994-03-12"
    assert profile_response.json()["interests"] == ["community", "live music"]

    create_post_response = client.post(
        "/posts/",
        headers=host_headers,
        json={
            "title": "Integration Test Event",
            "description": "A complete social workflow test event.",
            "category": "Community",
            "location": "Brixton",
            "image_url": event_image_url,
            "hashtags": ["#Community", "brixton", "community"],
            "event_date": "2030-08-20T18:30:00",
        },
    )
    assert create_post_response.status_code == 200
    post = create_post_response.json()
    assert post["owner"]["username"] == host["username"]
    assert post["image_url"] == event_image_url
    assert post["hashtags"] == ["community", "brixton"]
    assert post["owner"]["interests"] == ["community", "live music"]

    assert client.get(
        f"/users/search?query={host['username']}"
    ).status_code == 401

    search_response = client.get(
        f"/users/search?query={host['username']}",
        headers=guest_headers,
    )
    assert search_response.status_code == 200
    assert search_response.json()[0]["id"] == host["id"]
    assert "email" not in search_response.json()[0]
    assert "date_of_birth" not in search_response.json()[0]
    assert search_response.json()[0]["profile_photo_url"] == profile_image_url
    assert client.get(event_image_url).content == PNG_CONTENT

    like_post_response = client.post(
        f"/posts/{post['id']}/like",
        headers=guest_headers,
    )
    assert like_post_response.status_code == 200
    assert like_post_response.json()["like_count"] == 1

    liked_posts_response = client.get(
        "/auth/me/liked-posts",
        headers=guest_headers,
    )
    assert liked_posts_response.status_code == 200
    assert [liked_post["id"] for liked_post in liked_posts_response.json()] == [
        post["id"]
    ]

    create_comment_response = client.post(
        f"/posts/{post['id']}/comments",
        headers=guest_headers,
        json={"content": "Looking forward to this one."},
    )
    assert create_comment_response.status_code == 200
    comment = create_comment_response.json()
    assert comment["owner"]["username"] == guest["username"]

    like_comment_response = client.post(
        f"/comments/{comment['id']}/like",
        headers=host_headers,
    )
    assert like_comment_response.status_code == 200
    assert like_comment_response.json()["like_count"] == 1

    post_detail_response = client.get(f"/posts/{post['id']}")
    assert post_detail_response.status_code == 200
    assert post_detail_response.json()["like_count"] == 1
    assert post_detail_response.json()["comment_count"] == 1

    comments_response = client.get(f"/posts/{post['id']}/comments")
    assert comments_response.status_code == 200
    assert comments_response.json()[0]["like_count"] == 1

    forbidden_delete_response = client.delete(
        f"/comments/{comment['id']}",
        headers=host_headers,
    )
    assert forbidden_delete_response.status_code == 403

    unlike_comment_response = client.delete(
        f"/comments/{comment['id']}/like",
        headers=host_headers,
    )
    assert unlike_comment_response.status_code == 200
    assert unlike_comment_response.json()["like_count"] == 0

    assert client.delete(
        f"/comments/{comment['id']}", headers=guest_headers
    ).status_code == 200
    assert client.delete(
        f"/posts/{post['id']}/like", headers=guest_headers
    ).status_code == 200
    assert client.get(
        "/auth/me/liked-posts", headers=guest_headers
    ).json() == []
    assert client.delete(
        f"/posts/{post['id']}", headers=host_headers
    ).status_code == 200
    assert client.get(f"/posts/{post['id']}").status_code == 404
