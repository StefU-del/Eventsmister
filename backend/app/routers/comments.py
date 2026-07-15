from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db, get_current_user


router = APIRouter(
    tags=["Comments"]
)


@router.post(
    "/posts/{post_id}/comments",
    response_model=schemas.CommentResponse,
)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
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

    new_comment = models.Comment(
        content=comment.content,
        post_id=post_id,
        owner_id=current_user.id,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.get(
    "/posts/{post_id}/comments",
    response_model=list[schemas.CommentResponse],
)
def get_comments_for_post(
    post_id: int,
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(
        models.Post.id == post_id
    ).first()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    comments = db.query(models.Comment).filter(
        models.Comment.post_id == post_id
    ).order_by(
        models.Comment.created_at.desc()
    ).all()

    return comments


@router.delete("/comments/{comment_id}")
def delete_comment(
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

    if comment.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}