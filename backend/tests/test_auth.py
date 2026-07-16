import pytest
from sqlalchemy.exc import IntegrityError

from app.auth import create_access_token
from tests.database_setup import TestingSessionLocal, client

pytestmark = [pytest.mark.api, pytest.mark.auth]

def test_register_user():
    response = client.post(
        "/auth/register",
        json={
            "username":"testregisteruser",
            "email":"testregisteruser@example.com",
            "password":"Password123!"
        }
    )

    assert response.status_code == 200;
    data = response.json()
    assert data["username"] == "testregisteruser"
    assert data["email"] == "testregisteruser@example.com"
    assert "hashed_password" not in data

def test_login_user(create_user):
    create_user(
        username="testloginuser",
        password="Password123!",
        email="testloginuser@example.com"
    )

    response = client.post(
        "auth/login",
        json={
            "username": "testloginuser",
            "password": "Password123!",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_authenticated_user_can_get_their_private_profile(create_user, login_user):
    user = create_user(
        username="current_user",
        password="Password123!",
        email="current_user@example.com",
    )
    token = login_user("current_user", "Password123!")

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == user["id"]
    assert response.json()["email"] == "current_user@example.com"
    assert response.json()["date_of_birth"] is None
    assert response.json()["interests"] == []


def test_current_user_requires_authentication():
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_registration_rejects_weak_passwords():
    response = client.post(
        "/auth/register",
        json={
            "username": "weak_password_user",
            "email": "weak_password_user@example.com",
            "password": "password",
        },
    )

    assert response.status_code == 422


def test_registration_rejects_a_duplicate_username(create_user):
    create_user("duplicate_user", "first@example.com", "Password123!")

    response = client.post(
        "/auth/register",
        json={
            "username": "duplicate_user",
            "email": "second@example.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


def test_registration_rejects_a_duplicate_email(create_user):
    create_user("first_user", "duplicate@example.com", "Password123!")

    response = client.post(
        "/auth/register",
        json={
            "username": "second_user",
            "email": "duplicate@example.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already exists"


def test_registration_translates_a_unique_constraint_race(monkeypatch):
    def fail_commit(_session):
        raise IntegrityError("INSERT", {}, Exception("unique constraint"))

    monkeypatch.setattr(TestingSessionLocal.class_, "commit", fail_commit)

    response = client.post(
        "/auth/register",
        json={
            "username": "racing_user",
            "email": "racing@example.com",
            "password": "Password123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Username or email already exists"


@pytest.mark.parametrize(
    ("username", "password"),
    [
        ("missing_user", "Password123!"),
        ("login_user", "WrongPassword123!"),
    ],
)
def test_login_rejects_invalid_credentials(create_user, username, password):
    create_user("login_user", "login@example.com", "Password123!")

    response = client.post(
        "/auth/login",
        json={"username": username, "password": password},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


@pytest.mark.parametrize(
    "token",
    [
        "not-a-jwt",
        create_access_token({}),
        create_access_token({"sub": "missing_user"}),
    ],
)
def test_private_profile_rejects_invalid_token_claims(token):
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Token"


def test_authenticated_user_can_update_profile(auth_headers):
    response = client.patch(
        "/auth/me",
        headers=auth_headers,
        json={
            "date_of_birth": "1994-05-16",
            "interests": ["Music", "community", "music"],
            "profile_photo_url": "https://example.com/profile.jpg",
        },
    )

    assert response.status_code == 200
    assert response.json()["date_of_birth"] == "1994-05-16"
    assert response.json()["interests"] == ["music", "community"]
    assert response.json()["profile_photo_url"] == "https://example.com/profile.jpg"

    partial_response = client.patch(
        "/auth/me",
        headers=auth_headers,
        json={"interests": ["Arts"]},
    )

    assert partial_response.status_code == 200
    assert partial_response.json()["date_of_birth"] == "1994-05-16"
    assert partial_response.json()["interests"] == ["arts"]
    assert partial_response.json()["profile_photo_url"] == "https://example.com/profile.jpg"


@pytest.mark.parametrize(
    "profile",
    [
        {"date_of_birth": "2999-01-01", "interests": [], "profile_photo_url": None},
        {"date_of_birth": None, "interests": ["!invalid"], "profile_photo_url": None},
        {"date_of_birth": None, "interests": [], "profile_photo_url": "javascript:bad"},
    ],
)
def test_profile_update_validates_personal_fields(auth_headers, profile):
    response = client.patch("/auth/me", headers=auth_headers, json=profile)

    assert response.status_code == 422
