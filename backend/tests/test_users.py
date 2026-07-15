from uuid import uuid4

from tests.database_setup import client


def test_search_users_returns_matching_users(create_user):
    unique_id = uuid4().hex

    username = f"searchuser_{unique_id}"
    email = f"searchuser_{unique_id}@example.com"
    password = "Password123!"

    create_user(
        username=username,
        email=email,
        password=password,
    )

    response = client.get(f"/users/search?query={username}")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["username"] == username


def test_search_users_does_not_expose_hashed_password(create_user):
    unique_id = uuid4().hex

    username = f"privateuser_{unique_id}"
    email = f"privateuser_{unique_id}@example.com"
    password = "Password123!"

    create_user(
        username=username,
        email=email,
        password=password,
    )

    response = client.get(f"/users/search?query={username}")

    assert response.status_code == 200

    data = response.json()

    assert "hashed_password" not in data[0]


def test_get_user_by_id(create_user):
    unique_id = uuid4().hex

    username = f"profileuser_{unique_id}"
    email = f"profileuser_{unique_id}@example.com"
    password = "Password123!"

    user = create_user(
        username=username,
        email=email,
        password=password,
    )

    response = client.get(f"/users/{user['id']}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == user["id"]
    assert data["username"] == username
    assert data["email"] == email
    assert "hashed_password" not in data


def test_get_missing_user_returns_404():
    response = client.get("/users/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_get_posts_by_user(create_post, auth_headers):
    first_post = create_post(
        title="User Profile Event One",
        description="First event for this user.",
        category="Music",
        location="Camden",
        event_date="2026-07-20T19:30:00",
    )

    second_post = create_post(
        title="User Profile Event Two",
        description="Second event for this user.",
        category="Tech",
        location="Shoreditch",
        event_date="2026-08-10T18:00:00",
    )

    response = client.get(f"/users/{first_post['owner_id']}/posts")

    assert response.status_code == 200

    data = response.json()

    post_ids = [post["id"] for post in data]

    assert first_post["id"] in post_ids
    assert second_post["id"] in post_ids


def test_get_posts_by_missing_user_returns_404():
    response = client.get("/users/999999/posts")

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"