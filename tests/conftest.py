import pytest
from uuid import uuid4
from tests.database_setup import client

@pytest.fixture
def test_user_data():
    return {
        "username": "testuser",
        "password": "Password123!",
        "email": "testuser@example.com"
    }

@pytest.fixture
def create_user():
    def _create_user(username: str, email: str, password: str):
        response = client.post(
            "auth/register",
            json={
                "username": username,
                "password": password,
                "email": email
            },
        )

        assert response.status_code == 200
        return response.json()
    
    return _create_user

@pytest.fixture
def login_user():
    def _login_user(username:str, password:str):
        response = client.post(
            "auth/login",
            json={
                "username": username,
                "password": password
            }
        )

        assert response.status_code == 200
        return response.json()["access_token"]
    return _login_user

@pytest.fixture
def auth_headers(create_user, login_user):
    user_id = uuid4().hex

    username=f"testuser_{user_id}"
    email=f"testuser_{user_id}@example.com"
    password="Password123!"

    create_user(username, email, password)
    token=login_user(username, password)

    return {
        "Authorization" : f"Bearer {token}"
    }

@pytest.fixture
def create_post(auth_headers):
    def _create_post(
            title: str = "Test Event",
            description: str = "A test event description.",
            category: str = "Music",
            location: str = "Camden",
            event_date: str = "2026-07-20T19:30:00",
    ):
        response = client.post(
            "/posts/",
            headers=auth_headers,
                json={
                "title": title,
                "description": description,
                "category": category,
                "location": location,
                "event_date": event_date,
            },
        )

        assert response.status_code == 200
        return response.json()
    
    return _create_post


    
    



