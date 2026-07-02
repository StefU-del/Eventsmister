from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

# creete a class called User that has Base as its Parent Class
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 

    # Link each user with Posts, Comments and Likes - One-To-Many relationship
    # Delete all comments, likes and posts without an owner (delete-orphan)
    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="owner", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="owner", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey(User.id), nullable=False)
    title = Column(String(100), nullable=False)
    desciption = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="parentPost", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="parentPost", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey(User.id), nullable=False)
    post_id = Column(Integer, ForeignKey(Post.id), nullable=False)
    owner_id = Column(Integer, ForeignKey(User.id), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="comments")
    parentPost = relationship("Posts", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True, unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey(User.id), nullable=False)
    post_id = Column(Integer, ForeignKey(Post.id), nullable=False)
    
    owner = relationship("User", back_populates="likes")
    parentPost = relationship("Posts", back_populates="likes")


