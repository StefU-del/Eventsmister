import re
from datetime import date, datetime
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def validate_image_url(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned_value = value.strip()
    if not cleaned_value:
        return None

    parsed_url = urlparse(cleaned_value)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        raise ValueError("Image URL must be a valid http or https URL")
    return cleaned_value


def normalize_interests(values: list[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        interest = " ".join(value.strip().lower().split())
        if not re.fullmatch(r"[a-z0-9][a-z0-9 &_-]{0,29}", interest):
            raise ValueError("Interests must contain 1-30 letters, numbers, or spaces")
        if interest not in normalized:
            normalized.append(interest)
    return normalized


def normalize_hashtags(values: list[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        hashtag = value.strip().lower().removeprefix("#")
        if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,29}", hashtag):
            raise ValueError("Hashtags must contain 1-30 letters, numbers, hyphens, or underscores")
        if hashtag not in normalized:
            normalized.append(hashtag)
    return normalized


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr = Field(max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")

        # Length alone is weak, so require a simple mix without prescribing one symbol set.
        character_checks = (
            any(character.islower() for character in password),
            any(character.isupper() for character in password),
            any(character.isdigit() for character in password),
            any(not character.isalnum() for character in password),
        )
        if not all(character_checks):
            raise ValueError(
                "Password must include uppercase, lowercase, number, and symbol characters"
            )
        return password


class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 bytes")
        return password


class UserProfileUpdate(BaseModel):
    date_of_birth: date | None = None
    interests: list[str] = Field(default_factory=list, max_length=10)
    profile_photo_url: str | None = Field(default=None, max_length=500)

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date | None) -> date | None:
        if value is None:
            return None
        today = date.today()
        if value > today:
            raise ValueError("Date of birth cannot be in the future")
        if value.year < today.year - 120:
            raise ValueError("Date of birth must be within the last 120 years")
        return value

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, values: list[str]) -> list[str]:
        return normalize_interests(values)

    @field_validator("profile_photo_url")
    @classmethod
    def validate_profile_photo_url(cls, value: str | None) -> str | None:
        return validate_image_url(value)


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    interests: list[str]
    profile_photo_url: str | None
    created_at: datetime


class UserResponse(UserPublicResponse):
    email: EmailStr
    date_of_birth: date | None


class Token(BaseModel):
    access_token: str
    token_type: str


class LikedItemsResponse(BaseModel):
    post_ids: list[int]
    comment_ids: list[int]


class PostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    category: str = Field(min_length=2, max_length=50)
    location: str = Field(min_length=2, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    hashtags: list[str] = Field(default_factory=list, max_length=8)
    event_date: datetime

    @field_validator("image_url")
    @classmethod
    def validate_event_image_url(cls, value: str | None) -> str | None:
        return validate_image_url(value)

    @field_validator("hashtags")
    @classmethod
    def validate_hashtags(cls, values: list[str]) -> list[str]:
        return normalize_hashtags(values)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    owner: UserPublicResponse
    title: str
    description: str
    category: str
    location: str
    image_url: str | None
    hashtags: list[str]
    event_date: datetime
    created_at: datetime
    like_count: int
    comment_count: int


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    owner: UserPublicResponse
    post_id: int
    content: str
    created_at: datetime
    like_count: int


class LikeStatusResponse(BaseModel):
    message: str
    like_count: int


class ImageUploadResponse(BaseModel):
    url: str
