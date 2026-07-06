from tests.database_setup import client

def test_get_posts_returns_list():
    response = client.get("/posts/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_post_requires_authentication():
    response = client.post(
        "/posts/",
        json={
            "title": "Jazz Night in Camden",
            "description": "Live jazz event in Camden.",
            "category": "Music",
            "location": "Camden",
            "event_date": "2026-07-20T19:30:00"
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_authenticated_user_can_create_post(auth_headers):
    response = client.post(
        "/posts/",
        headers=auth_headers,
        json={
            "title": "Tech Meetup in Shoreditch",
            "description": "A meetup for developers and tech enthusiasts.",
            "category": "Tech",
            "location": "Shoreditch",
            "event_date": "2026-08-10T18:00:00",
        }
    )

    assert response.status_code == 200
    
    data = response.json()

    assert data["title"] == "Tech Meetup in Shoreditch"
    assert data["description"] == "A meetup for developers and tech enthusiasts."
    assert data["category"] == "Tech"
    assert data["location"] == "Shoreditch"

def test_get_single_post(create_post):
    post = create_post(
        title="Food Market in Borough",
        description="Street food and local vendors.",
        category="Food",
        location="Borough",
        event_date="2026-09-01T12:00:00",
    )

    response = client.get(f"/posts/{post['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == post["id"]
    assert response.json()["title"] == "Food Market in Borough"

def test_user_can_delete_own_post(create_post, auth_headers):
    post = create_post(
        title="Comedy Night",
        description="Stand-up comedy event.",
        category="Comedy",
        location="Soho",
        event_date="2026-10-05T20:00:00",
    )

    delete_response = client.delete(
        f"/posts/{post['id']}",
        headers=auth_headers,
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Post deleted successfully"

def test_user_cannot_delete_someone_elses_post(create_user, login_user, auth_headers):
    post_response = client.post(
        "/posts/",
        headers=auth_headers,
        json={
            "title": "Theatre Evening",
            "description": "A West End theatre event.",
            "category": "Theatre",
            "location": "West End",
            "event_date": "2026-11-15T19:00:00",
        },
    )

    assert post_response.status_code == 200
    post_id = post_response.json()["id"]

    create_user(
        username="otheruser",
        email="otheruser@example.com",
        password="Pass123!"
    )

    other_user_token = login_user("otheruser", "Pass123!")
    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}"
    }

    delete_response = client.delete(
        f"/posts/{post_id}",
        headers=other_user_headers,
    )

    assert delete_response.status_code == 403    