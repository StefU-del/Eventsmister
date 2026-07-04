from tests.database_setup import client


def create_test_user_and_login(username: str, email: str) -> str:
    client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "Password123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        json={
            "username": username,
            "password": "Password123!",
        },
    )

    return login_response.json()["access_token"]


def test_get_posts_returns_list():
    response = client.get("/posts/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_post_requires_login():
    response = client.post(
        "/posts/",
        json={
            "title": "Jazz Night in Camden",
            "description": "Live jazz event in Camden.",
            "category": "Music",
            "location": "Camden",
            "event_date": "2026-07-20T19:30:00",
        },
    )

    assert response.status_code == 401


def test_logged_in_user_can_create_post():
    token = create_test_user_and_login(
        username="postcreator",
        email="postcreator@example.com",
    )

    response = client.post(
        "/posts/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "title": "Tech Meetup in Shoreditch",
            "description": "A meetup for developers and tech enthusiasts.",
            "category": "Tech",
            "location": "Shoreditch",
            "event_date": "2026-08-10T18:00:00",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Tech Meetup in Shoreditch"
    assert data["description"] == "A meetup for developers and tech enthusiasts."
    assert data["category"] == "Tech"
    assert data["location"] == "Shoreditch"
    assert "owner_id" in data


def test_get_single_post():
    token = create_test_user_and_login(
        username="singlepostuser",
        email="singlepostuser@example.com",
    )

    create_response = client.post(
        "/posts/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "title": "Food Market in Borough",
            "description": "Street food and local vendors.",
            "category": "Food",
            "location": "Borough",
            "event_date": "2026-09-01T12:00:00",
        },
    )

    post_id = create_response.json()["id"]

    response = client.get(f"/posts/{post_id}")

    assert response.status_code == 200
    assert response.json()["id"] == post_id
    assert response.json()["title"] == "Food Market in Borough"


def test_user_can_delete_own_post():
    token = create_test_user_and_login(
        username="deleteowner",
        email="deleteowner@example.com",
    )

    create_response = client.post(
        "/posts/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "title": "Comedy Night",
            "description": "Stand-up comedy event.",
            "category": "Comedy",
            "location": "Soho",
            "event_date": "2026-10-05T20:00:00",
        },
    )

    post_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/posts/{post_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Post deleted successfully"


def test_user_cannot_delete_someone_elses_post():
    owner_token = create_test_user_and_login(
        username="realowner",
        email="realowner@example.com",
    )

    other_user_token = create_test_user_and_login(
        username="otheruser",
        email="otheruser@example.com",
    )

    create_response = client.post(
        "/posts/",
        headers={
            "Authorization": f"Bearer {owner_token}"
        },
        json={
            "title": "Theatre Evening",
            "description": "A West End theatre event.",
            "category": "Theatre",
            "location": "West End",
            "event_date": "2026-11-15T19:00:00",
        },
    )

    post_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/posts/{post_id}",
        headers={
            "Authorization": f"Bearer {other_user_token}"
        },
    )

    assert delete_response.status_code == 403