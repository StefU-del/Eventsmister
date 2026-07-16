from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user, get_db


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/me", response_model=schemas.UserResponse)
def get_authenticated_user(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


@router.get("/me/likes", response_model=schemas.LikedItemsResponse)
def get_authenticated_user_likes(
    current_user: models.User = Depends(get_current_user),
):
    # Returning identifiers keeps the payload small while letting every screen hydrate like state.
    return {
        "post_ids": [like.post_id for like in current_user.likes if like.post_id is not None],
        "comment_ids": [
            like.comment_id for like in current_user.likes if like.comment_id is not None
        ],
    }


@router.get("/me/liked-posts", response_model=list[schemas.PostResponse])
def get_authenticated_user_liked_posts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Return full event records so the hearted view does not need one request per post.
    return (
        db.query(models.Post)
        .join(models.Like, models.Like.post_id == models.Post.id)
        .options(joinedload(models.Post.owner))
        .filter(models.Like.owner_id == current_user.id)
        .order_by(models.Post.event_date.asc())
        .all()
    )


@router.patch("/me", response_model=schemas.UserResponse)
def update_authenticated_user(
    profile: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # PATCH preserves fields the client did not send while still allowing explicit nulls.
    for field_name in profile.model_fields_set:
        setattr(current_user, field_name, getattr(profile, field_name))
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_username = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        ) from error
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    password_is_valid = verify_password(
        user.password,
        db_user.hashed_password
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        data={"sub": db_user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
