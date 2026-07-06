from tests.database_setup import client


def test_like_post_requires_authentication(create_post):
    post = create_post()

    response = client.post(f"/posts/{post['id']}/like")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_authenticated_user_can_like_post(create_post, auth_headers):
    post = create_post()

    response = client.post(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Post liked successfully"


def test_user_cannot_like_same_post_twice(create_post, auth_headers):
    post = create_post()

    first_response = client.post(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    second_response = client.post(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "You have already liked this post"


def test_authenticated_user_can_unlike_post(create_post, auth_headers):
    post = create_post()

    like_response = client.post(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    unlike_response = client.delete(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    assert like_response.status_code == 200
    assert unlike_response.status_code == 200
    assert unlike_response.json()["message"] == "Post unliked successfully"


def test_user_cannot_unlike_post_they_have_not_liked(create_post, auth_headers):
    post = create_post()

    response = client.delete(
        f"/posts/{post['id']}/like",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "You have not liked this post"


def test_cannot_like_post_that_does_not_exist(auth_headers):
    response = client.post(
        "/posts/999999/like",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"


def test_cannot_unlike_post_that_does_not_exist(auth_headers):
    response = client.delete(
        "/posts/999999/like",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Post not found"