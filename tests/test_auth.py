from tests.database_setup import client

def test_register_user():
    response = client.post(
        "/auth/register",
        json={
            "username":"testuiiser",
            "email":"testuser@example.com",
            "password":"Password123!"
        }
    )

    assert response.status_code == 200;

def test_login_user():
    response = client.post(
        "auth/login",
        json={
            "username":"testuiiser",
            "password":"Password123!"
        }
    )

    assert response.status_code == 200;