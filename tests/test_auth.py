from tests.database_setup import client

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
