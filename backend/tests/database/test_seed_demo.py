from datetime import datetime, timezone

import pytest

from app import models
from app.seed_demo import DEMO_PASSWORD, SeedStats, seed_demo_data
from tests.database_setup import TestingSessionLocal


pytestmark = pytest.mark.database


def test_demo_seed_creates_repeatable_social_data_without_removing_regular_users(
    monkeypatch,
):
    # Password behaviour is covered separately; avoiding bcrypt keeps this data test quick.
    monkeypatch.setattr("app.seed_demo.hash_password", lambda password: f"hashed:{password}")
    fixed_time = datetime(2026, 7, 16, 12, 0, tzinfo=timezone.utc)

    with TestingSessionLocal() as db:
        regular_user = models.User(
            username="regular_user",
            email="regular@example.com",
            hashed_password="existing-hash",
        )
        db.add(regular_user)
        db.commit()

        first_stats = seed_demo_data(db, now=fixed_time)
        second_stats = seed_demo_data(db, now=fixed_time)

        assert first_stats == second_stats == SeedStats(
            users=30,
            posts=100,
            comments=400,
            post_likes=796,
            comment_likes=800,
        )
        assert db.query(models.User).count() == 31
        assert db.query(models.User).filter_by(username="regular_user").one()
        assert db.query(models.Post).count() == 100
        assert db.query(models.Comment).count() == 400
        assert db.query(models.Like).count() == 1596

        demo_users = db.query(models.User).filter(
            models.User.username.like("demo_%")
        ).all()
        assert {user.hashed_password for user in demo_users} == {
            f"hashed:{DEMO_PASSWORD}"
        }
        assert all(user.date_of_birth for user in demo_users)
        assert all(len(user.interests) == 3 for user in demo_users)
        assert all(user.profile_photo_url for user in demo_users)

        posts = db.query(models.Post).all()
        assert {post.category for post in posts} >= {
            "Music",
            "Food",
            "Arts",
            "Community",
            "Sports",
            "Tech",
            "Learning",
            "Other",
        }
        assert "Sport" not in {post.category for post in posts}
        assert len({post.image_url for post in posts}) == 100
        assert {post.owner_id for post in posts} == {user.id for user in demo_users}
