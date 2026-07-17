import pytest

from tests.database_setup import client

pytestmark = pytest.mark.api


def test_root_exposes_the_versioned_api_identity():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Eventsmister API"}
    assert response.headers["content-type"] == "application/json"


def test_openapi_documents_resources_and_bearer_authentication():
    response = client.get("/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "Eventsmister App"
    assert document["info"]["version"] == "1.0.0"
    assert {
        "/auth/register",
        "/auth/login",
        "/auth/me",
        "/posts/",
        "/uploads/images",
        "/users/search",
        "/discover/external",
    }.issubset(document["paths"])
    assert document["components"]["securitySchemes"]["OAuth2PasswordBearer"]["type"] == "oauth2"


def test_unknown_route_and_unsupported_method_use_standard_errors():
    missing_response = client.get("/does-not-exist")
    method_response = client.put("/posts/")

    assert missing_response.status_code == 404
    assert missing_response.json() == {"detail": "Not Found"}
    assert method_response.status_code == 405
    assert method_response.json() == {"detail": "Method Not Allowed"}


def test_malformed_json_returns_a_validation_response(auth_headers):
    response = client.post(
        "/posts/",
        headers={**auth_headers, "Content-Type": "application/json"},
        content='{"title":',
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "json_invalid"


def test_path_and_query_parameters_are_validated(auth_headers):
    path_response = client.get("/posts/not-an-integer")
    query_response = client.get("/users/search?query=", headers=auth_headers)

    assert path_response.status_code == 422
    assert query_response.status_code == 422
