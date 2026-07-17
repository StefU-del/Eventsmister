from fastapi import APIRouter, Depends, HTTPException, Query, status

from app import models, schemas
from app.dependencies import get_current_user
from app.services.external_events import discover_external_events


router = APIRouter(prefix="/discover", tags=["Discovery"])


@router.get("/external", response_model=schemas.ExternalDiscoveryResponse)
async def get_external_events(
    query: str = Query(default="", max_length=80),
    current_user: models.User = Depends(get_current_user),
):
    cleaned_query = " ".join(query.split())
    if not cleaned_query and not current_user.interests:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Add search terms or profile interests before searching",
        )

    return await discover_external_events(
        query=cleaned_query,
        interests=current_user.interests,
    )
