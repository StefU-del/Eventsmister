from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    select,
)
from sqlalchemy.orm import column_property, relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    interests = Column(JSON, nullable=False, default=list, server_default="[]")
    profile_photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Owned content is removed with its user so no orphaned social data remains.
    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="owner", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="owner", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)
    hashtags = Column(JSON, nullable=False, default=list, server_default="[]")
    event_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="parent_post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="parent_post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="comments")
    parent_post = relationship("Post", back_populates="comments")
    likes = relationship("Like", back_populates="parent_comment", cascade="all, delete-orphan")

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)

    owner = relationship("User", back_populates="likes")
    parent_post = relationship("Post", back_populates="likes")
    parent_comment = relationship("Comment", back_populates="likes")

    __table_args__ = (
        CheckConstraint(
            "(post_id IS NOT NULL AND comment_id IS NULL) OR "
            "(post_id IS NULL AND comment_id IS NOT NULL)",
            name="like_must_belong_to_post_or_comment_not_both",
        ),
        # These constraints make duplicate likes impossible even under concurrent requests.
        UniqueConstraint("owner_id", "post_id", name="uq_likes_owner_post"),
        UniqueConstraint("owner_id", "comment_id", name="uq_likes_owner_comment"),
    )


# Count subqueries keep API list responses constant-query without loading social rows.
Post.like_count = column_property(
    select(func.count(Like.id))
    .where(Like.post_id == Post.id)
    .correlate_except(Like)
    .scalar_subquery()
)
Post.comment_count = column_property(
    select(func.count(Comment.id))
    .where(Comment.post_id == Post.id)
    .correlate_except(Comment)
    .scalar_subquery()
)
Comment.like_count = column_property(
    select(func.count(Like.id))
    .where(Like.comment_id == Comment.id)
    .correlate_except(Like)
    .scalar_subquery()
)
