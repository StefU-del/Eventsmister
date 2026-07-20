from datetime import datetime

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from app import models
from tests.database_setup import TestingSessionLocal, engine

pytestmark = pytest.mark.database


def make_user(username: str = "database_user") -> models.User:
    return models.User(
        username=username,
        email=f"{username}@example.com",
        hashed_password="hashed-password",
    )


def make_post(owner: models.User) -> models.Post:
    return models.Post(
        owner=owner,
        title="Database Test Event",
        description="An event persisted directly through SQLAlchemy.",
        category="Testing",
        location="London",
        event_date=datetime(2030, 5, 20, 18, 30),
    )


def test_like_requires_exactly_one_target():
    with TestingSessionLocal() as session:
        user = make_user()
        post = make_post(user)
        comment = models.Comment(content="A database comment", owner=user, parent_post=post)
        session.add_all([user, post, comment])
        session.commit()

        session.add(models.Like(owner_id=user.id))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        session.add(
            models.Like(owner_id=user.id, post_id=post.id, comment_id=comment.id)
        )
        with pytest.raises(IntegrityError):
            session.commit()


def test_duplicate_likes_are_rejected_by_the_database():
    with TestingSessionLocal() as session:
        user = make_user()
        post = make_post(user)
        session.add_all([user, post])
        session.commit()

        session.add(models.Like(owner_id=user.id, post_id=post.id))
        session.commit()
        session.add(models.Like(owner_id=user.id, post_id=post.id))

        with pytest.raises(IntegrityError):
            session.commit()


def test_deleting_a_post_cascades_to_comments_and_likes():
    with TestingSessionLocal() as session:
        owner = make_user("cascade_owner")
        participant = make_user("cascade_participant")
        post = make_post(owner)
        comment = models.Comment(content="Delete with parent", owner=participant, parent_post=post)
        post.likes.append(models.Like(owner=participant))
        comment.likes.append(models.Like(owner=owner))
        session.add_all([owner, participant, post, comment])
        session.commit()

        session.delete(post)
        session.commit()

        assert session.query(models.Post).count() == 0
        assert session.query(models.Comment).count() == 0
        assert session.query(models.Like).count() == 0


def test_sqlite_rejects_orphaned_foreign_keys():
    with TestingSessionLocal() as session:
        session.add(
            models.Post(
                owner_id=999_999,
                title="Orphaned Event",
                description="This insert must not bypass the user relationship.",
                category="Testing",
                location="London",
                event_date=datetime(2030, 5, 20, 18, 30),
            )
        )

        with pytest.raises(IntegrityError):
            session.commit()

