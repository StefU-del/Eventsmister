from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

@router.get("/", response_model=list[schemas.PostResponse])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).options(
        joinedload(models.Post.owner)
    ).order_by(
        models.Post.created_at.desc()
    ).all()

    return posts

@router.post("/", response_model=schemas.PostResponse)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    new_post = models.Post(
        title=post.title,
        description=post.description,
        location=post.location,
        event_date=post.event_date,
        category=post.category,
        image_url=post.image_url,
        hashtags=post.hashtags,
        owner=user,
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post

@router.get("/{post_id}", response_model=schemas.PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db)
):

    post = db.query(models.Post).options(
        joinedload(models.Post.owner)
    ).filter(
        models.Post.id == post_id
    ).first()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return post

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    post = db.query(models.Post).filter(
        models.Post.id == post_id
    ).first()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    if post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}
