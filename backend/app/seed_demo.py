from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import models
from app.auth import hash_password
from app.database import Base, SessionLocal, engine, migrate_legacy_schema


DEMO_USERNAME_PREFIX = "demo_"
DEMO_PASSWORD = "DemoPass123!"


@dataclass(frozen=True)
class EventTheme:
    title: str
    category: str
    summary: str
    hashtags: tuple[str, ...]


@dataclass(frozen=True)
class SeedStats:
    users: int
    posts: int
    comments: int
    post_likes: int
    comment_likes: int


USERNAMES = (
    "demo_aisha",
    "demo_alex",
    "demo_amina",
    "demo_ben",
    "demo_carla",
    "demo_daniel",
    "demo_elena",
    "demo_farid",
    "demo_freya",
    "demo_george",
    "demo_hana",
    "demo_harry",
    "demo_ines",
    "demo_jamal",
    "demo_jess",
    "demo_kai",
    "demo_layla",
    "demo_leo",
    "demo_marta",
    "demo_maya",
    "demo_nadia",
    "demo_noah",
    "demo_olivia",
    "demo_omar",
    "demo_priya",
    "demo_ravi",
    "demo_sam",
    "demo_sofia",
    "demo_tariq",
    "demo_zara",
)

INTEREST_GROUPS = (
    ("music", "jazz", "live music"),
    ("food", "markets", "coffee"),
    ("arts", "film", "photography"),
    ("community", "volunteering", "gardening"),
    ("sports", "running", "football"),
    ("tech", "coding", "startups"),
    ("learning", "languages", "workshops"),
    ("games", "social", "local events"),
)

LOCATIONS = (
    "Brixton",
    "Camden",
    "Clapham",
    "Dalston",
    "Deptford",
    "Greenwich",
    "Hackney",
    "Hampstead",
    "Islington",
    "King's Cross",
    "Lewisham",
    "Notting Hill",
    "Peckham",
    "Richmond",
    "Shoreditch",
    "Soho",
    "South Bank",
    "Stratford",
    "Tooting",
    "Walthamstow",
)

EVENT_THEMES = (
    EventTheme(
        "Jazz courtyard",
        "Music",
        "An easy-going live jazz session with local musicians and covered seating.",
        ("jazz", "live-music", "local"),
    ),
    EventTheme(
        "Indie showcase",
        "Music",
        "Three emerging bands share a stage for an intimate evening of new music.",
        ("indie", "live-music", "new-bands"),
    ),
    EventTheme(
        "Open mic night",
        "Music",
        "A welcoming open stage for singers, poets, comics, and first-time performers.",
        ("open-mic", "performance", "community"),
    ),
    EventTheme(
        "Vinyl listening party",
        "Music",
        "Bring a favourite record or simply settle in for a carefully curated playlist.",
        ("vinyl", "dj", "social"),
    ),
    EventTheme(
        "Street food market",
        "Food",
        "Independent cooks serve a changing menu of affordable dishes and sweet treats.",
        ("street-food", "market", "foodies"),
    ),
    EventTheme(
        "Vegan supper club",
        "Food",
        "A relaxed shared-table dinner featuring seasonal plant-based cooking.",
        ("vegan", "supper-club", "seasonal"),
    ),
    EventTheme(
        "Coffee tasting lab",
        "Food",
        "Compare single-origin coffees and learn practical brewing tips from local roasters.",
        ("coffee", "tasting", "workshop"),
    ),
    EventTheme(
        "Gallery late",
        "Arts",
        "Explore new work from London artists with short talks and an evening soundtrack.",
        ("art", "gallery", "london-artists"),
    ),
    EventTheme(
        "Pottery workshop",
        "Arts",
        "A hands-on clay session for beginners with materials and firing included.",
        ("pottery", "craft", "beginners"),
    ),
    EventTheme(
        "Outdoor cinema",
        "Arts",
        "A big-screen neighbourhood film night with deckchairs and local snacks.",
        ("film", "outdoor-cinema", "screening"),
    ),
    EventTheme(
        "Neighbourhood picnic",
        "Community",
        "Meet people from nearby streets over shared food, games, and conversation.",
        ("picnic", "neighbours", "family-friendly"),
    ),
    EventTheme(
        "Volunteer gardening day",
        "Community",
        "Help care for a shared green space; tools, guidance, and refreshments are provided.",
        ("volunteering", "gardening", "green-space"),
    ),
    EventTheme(
        "Community clothes swap",
        "Community",
        "Refresh your wardrobe sustainably by exchanging clean, good-condition clothes.",
        ("clothes-swap", "sustainable", "community"),
    ),
    EventTheme(
        "Riverside run club",
        "Sports",
        "A social five-kilometre run with pace groups and a post-run coffee stop.",
        ("running", "run-club", "fitness"),
    ),
    EventTheme(
        "Social football",
        "Sports",
        "Friendly mixed-ability five-a-side football with teams arranged on arrival.",
        ("football", "five-a-side", "social-sports"),
    ),
    EventTheme(
        "Beginner yoga in the park",
        "Sports",
        "A calm outdoor class focused on accessible movement, balance, and breathing.",
        ("yoga", "wellbeing", "beginners"),
    ),
    EventTheme(
        "Product builders meetup",
        "Tech",
        "Short practical talks followed by open networking for designers and developers.",
        ("tech", "product", "networking"),
    ),
    EventTheme(
        "Community coding workshop",
        "Tech",
        "Work through a small web project with volunteer mentors and peer support.",
        ("coding", "workshop", "web-development"),
    ),
    EventTheme(
        "Language exchange",
        "Learning",
        "Practise conversation in small groups with friendly prompts and rotating partners.",
        ("languages", "learning", "conversation"),
    ),
    EventTheme(
        "Board game social",
        "Other",
        "Drop in for modern board games, patient hosts, and tables for every experience level.",
        ("board-games", "social", "games-night"),
    ),
)

EVENT_EDITIONS = (
    "Opening session",
    "Summer edition",
    "Weekend edition",
    "Community edition",
    "Late edition",
)

COMMENT_TEXTS = (
    "This looks excellent. I have added it to my calendar.",
    "Is there still space for one more person?",
    "I went to the last one and had a brilliant time.",
    "Thanks for organising this for the neighbourhood.",
    "Would this be suitable for someone coming alone?",
    "The location is perfect for me. Looking forward to it.",
    "A couple of friends and I are planning to join.",
    "Do we need to bring anything with us?",
    "Really pleased to see this happening locally.",
    "I cannot make this date, but I hope there is another soon.",
)


def _rotated_users(
    users: list[models.User],
    *,
    start: int,
    count: int,
    excluded_user_id: int,
) -> list[models.User]:
    eligible_users = [user for user in users if user.id != excluded_user_id]
    return [
        eligible_users[(start + offset) % len(eligible_users)]
        for offset in range(count)
    ]


def seed_demo_data(
    db: Session,
    *,
    now: datetime | None = None,
) -> SeedStats:
    """Replace demo-owned records while preserving ordinary development accounts."""
    current_time = now or datetime.now(timezone.utc)

    try:
        existing_demo_users = db.query(models.User).filter(
            models.User.username.like(f"{DEMO_USERNAME_PREFIX}%")
        ).all()
        for user in existing_demo_users:
            db.delete(user)
        db.flush()

        users = []
        for index, username in enumerate(USERNAMES):
            user = models.User(
                username=username,
                email=f"{username}@example.com",
                hashed_password=hash_password(DEMO_PASSWORD),
                date_of_birth=date(
                    1980 + (index % 23),
                    1 + (index % 12),
                    1 + ((index * 3) % 27),
                ),
                interests=list(INTEREST_GROUPS[index % len(INTEREST_GROUPS)]),
                profile_photo_url=f"https://i.pravatar.cc/320?u={username}",
                created_at=current_time - timedelta(days=60 - index),
            )
            db.add(user)
            users.append(user)
        db.flush()

        posts = []
        for post_index in range(100):
            theme = EVENT_THEMES[post_index % len(EVENT_THEMES)]
            edition = EVENT_EDITIONS[post_index // len(EVENT_THEMES)]
            location = LOCATIONS[(post_index * 7) % len(LOCATIONS)]
            post = models.Post(
                owner=users[post_index % len(users)],
                title=f"{theme.title}: {edition}",
                description=(
                    f"{theme.summary} This {edition.lower()} takes place in {location}; "
                    "book early and check the event conversation for final details."
                ),
                category=theme.category,
                location=location,
                image_url=(
                    "https://picsum.photos/seed/"
                    f"eventsmister-{post_index + 1:03d}/1200/675"
                ),
                hashtags=[
                    *theme.hashtags,
                    location.lower().replace("'", "").replace(" ", "-"),
                ],
                event_date=current_time
                + timedelta(days=4 + post_index, hours=post_index % 4),
                created_at=current_time
                - timedelta(days=(100 - post_index) % 30, minutes=post_index * 7),
            )
            db.add(post)
            posts.append(post)
        db.flush()

        comments = []
        for post_index, post in enumerate(posts):
            comment_count = 2 + (post_index % 5)
            commenters = _rotated_users(
                users,
                start=post_index * 2,
                count=comment_count,
                excluded_user_id=post.owner_id,
            )
            for comment_offset, commenter in enumerate(commenters):
                comment = models.Comment(
                    owner=commenter,
                    parent_post=post,
                    content=COMMENT_TEXTS[
                        (post_index + comment_offset) % len(COMMENT_TEXTS)
                    ],
                    created_at=post.created_at
                    + timedelta(hours=2 + comment_offset),
                )
                db.add(comment)
                comments.append(comment)
        db.flush()

        post_likes = []
        for post_index, post in enumerate(posts):
            likers = _rotated_users(
                users,
                start=post_index * 3,
                count=4 + (post_index % 9),
                excluded_user_id=post.owner_id,
            )
            for liker in likers:
                like = models.Like(owner=liker, parent_post=post)
                db.add(like)
                post_likes.append(like)

        comment_likes = []
        for comment_index, comment in enumerate(comments):
            likers = _rotated_users(
                users,
                start=comment_index * 5,
                count=comment_index % 5,
                excluded_user_id=comment.owner_id,
            )
            for liker in likers:
                like = models.Like(owner=liker, parent_comment=comment)
                db.add(like)
                comment_likes.append(like)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return SeedStats(
        users=len(users),
        posts=len(posts),
        comments=len(comments),
        post_likes=len(post_likes),
        comment_likes=len(comment_likes),
    )


def main() -> None:
    migrate_legacy_schema()
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        stats = seed_demo_data(db)

    print("Demo data ready:")
    print(f"  Users:         {stats.users}")
    print(f"  Events:        {stats.posts}")
    print(f"  Comments:      {stats.comments}")
    print(f"  Event likes:   {stats.post_likes}")
    print(f"  Comment likes: {stats.comment_likes}")
    print(f"  Login:         {USERNAMES[0]} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
