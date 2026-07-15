from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.dependencies import get_db, get_current_user


router = APIRouter(
    tags=["Likes"]
)


@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).filter(
        models.Post.id == post_id
    ).first()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.owner_id == current_user.id,
    ).first()

    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already liked this post",
        )

    new_like = models.Like(
        post_id=post_id,
        owner_id=current_user.id,
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    return {"message": "Post liked successfully"}


@router.delete("/posts/{post_id}/like")
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).filter(
        models.Post.id == post_id
    ).first()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.owner_id == current_user.id,
    ).first()

    if existing_like is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not liked this post",
        )

    db.delete(existing_like)
    db.commit()

    return {"message": "Post unliked successfully"}

@router.post("/comments/{comment_id}/like")
def like_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id
    ).first()

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    existing_like = db.query(models.Like).filter(
        models.Like.comment_id == comment_id,
        models.Like.owner_id == current_user.id,
    ).first()

    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already liked this comment",
        )

    new_like = models.Like(
        comment_id=comment_id,
        owner_id=current_user.id,
    )

    db.add(new_like)
    db.commit()
    db.refresh(new_like)

    return {"message": "Comment liked successfully"}


@router.delete("/comments/{comment_id}/like")
def unlike_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id
    ).first()

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    existing_like = db.query(models.Like).filter(
        models.Like.comment_id == comment_id,
        models.Like.owner_id == current_user.id,
    ).first()

    if existing_like is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not liked this comment",
        )

    db.delete(existing_like)
    db.commit()

    return {"message": "Comment unliked successfully"}
