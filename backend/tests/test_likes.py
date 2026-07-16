import pytest

from tests.database_setup import client

pytestmark = pytest.mark.api


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
    assert response.json()["like_count"] == 1


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
    assert unlike_response.json()["like_count"] == 0


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


def test_like_comment_requires_authentication(create_post, create_comment):
    post = create_post()
    comment = create_comment(post_id=post["id"])

    response = client.post(f"/comments/{comment['id']}/like")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_authenticated_user_can_like_comment(
    create_post,
    create_comment,
    auth_headers,
):
    post = create_post()
    comment = create_comment(post_id=post["id"])

    response = client.post(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Comment liked successfully"
    assert response.json()["like_count"] == 1


def test_user_cannot_like_same_comment_twice(
    create_post,
    create_comment,
    auth_headers,
):
    post = create_post()
    comment = create_comment(post_id=post["id"])

    first_response = client.post(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    second_response = client.post(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "You have already liked this comment"


def test_authenticated_user_can_unlike_comment(
    create_post,
    create_comment,
    auth_headers,
):
    post = create_post()
    comment = create_comment(post_id=post["id"])

    like_response = client.post(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    unlike_response = client.delete(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    assert like_response.status_code == 200
    assert unlike_response.status_code == 200
    assert unlike_response.json()["message"] == "Comment unliked successfully"
    assert unlike_response.json()["like_count"] == 0


def test_authenticated_user_can_list_their_likes(
    create_post,
    create_comment,
    auth_headers,
):
    post = create_post()
    comment = create_comment(post_id=post["id"])
    client.post(f"/posts/{post['id']}/like", headers=auth_headers)
    client.post(f"/comments/{comment['id']}/like", headers=auth_headers)

    response = client.get("/auth/me/likes", headers=auth_headers)

    assert response.status_code == 200
    assert post["id"] in response.json()["post_ids"]
    assert comment["id"] in response.json()["comment_ids"]


def test_liked_posts_require_authentication():
    response = client.get("/auth/me/liked-posts")

    assert response.status_code == 401


def test_authenticated_user_can_list_their_liked_posts(create_post, auth_headers):
    later_post = create_post(
        title="Later hearted event",
        event_date="2030-08-20T19:30:00",
    )
    earlier_post = create_post(
        title="Earlier hearted event",
        event_date="2030-07-20T19:30:00",
    )
    create_post(title="Not hearted event", event_date="2030-06-20T19:30:00")

    client.post(f"/posts/{later_post['id']}/like", headers=auth_headers)
    client.post(f"/posts/{earlier_post['id']}/like", headers=auth_headers)

    response = client.get("/auth/me/liked-posts", headers=auth_headers)

    assert response.status_code == 200
    assert [post["id"] for post in response.json()] == [
        earlier_post["id"],
        later_post["id"],
    ]
    assert response.json()[0]["owner"]["username"]
    assert response.json()[0]["like_count"] == 1

    client.delete(f"/posts/{earlier_post['id']}/like", headers=auth_headers)
    updated_response = client.get("/auth/me/liked-posts", headers=auth_headers)

    assert [post["id"] for post in updated_response.json()] == [later_post["id"]]


def test_user_cannot_unlike_comment_they_have_not_liked(
    create_post,
    create_comment,
    auth_headers,
):
    post = create_post()
    comment = create_comment(post_id=post["id"])

    response = client.delete(
        f"/comments/{comment['id']}/like",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "You have not liked this comment"


def test_cannot_like_comment_that_does_not_exist(auth_headers):
    response = client.post(
        "/comments/999999/like",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Comment not found"


def test_cannot_unlike_comment_that_does_not_exist(auth_headers):
    response = client.delete(
        "/comments/999999/like",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Comment not found"
