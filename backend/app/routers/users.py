from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.dependencies import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/search", response_model=list[schemas.UserResponse])
def search_users(
    query: str = Query(min_length=1),
    db: Session = Depends(get_db),
):
    
    users = db.query(models.User).filter(
        models.User.username.ilike(f"%{query}%")
    ).all()

    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/{user_id}/posts", response_model=list[schemas.PostResponse])
def get_posts_by_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    posts = db.query(models.Post).filter(
        models.Post.owner_id == user_id
    ).order_by(
        models.Post.created_at.desc()
    ).all()

    return posts