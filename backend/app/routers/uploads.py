import os
import re
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse

from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

BACKEND_DIRECTORY = Path(__file__).resolve().parents[2]
UPLOAD_DIRECTORY = Path(
    os.getenv("UPLOAD_DIRECTORY", str(BACKEND_DIRECTORY / "uploads"))
)
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MEDIA_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
STORED_IMAGE_PATTERN = re.compile(r"^[0-9a-f]{32}\.(?:jpg|png|webp)$")


def detect_image_media_type(content: bytes) -> str | None:
    """Identify the supported image formats from their binary signatures."""
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if (
        len(content) >= 12
        and content.startswith(b"RIFF")
        and content[8:12] == b"WEBP"
    ):
        return "image/webp"
    return None


@router.post("/images", response_model=schemas.ImageUploadResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    _current_user: models.User = Depends(get_current_user),
):
    claimed_media_type = file.content_type
    if claimed_media_type not in MEDIA_TYPE_EXTENSIONS:
        await file.close()
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPEG, PNG, or WebP image",
        )

    content = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be 5 MB or smaller",
        )

    detected_media_type = detect_image_media_type(content)
    if detected_media_type != claimed_media_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="The file content does not match its image type",
        )

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{MEDIA_TYPE_EXTENSIONS[detected_media_type]}"
    (UPLOAD_DIRECTORY / filename).write_bytes(content)

    return {"url": str(request.url_for("get_uploaded_image", filename=filename))}


@router.get("/{filename}", name="get_uploaded_image", response_class=FileResponse)
def get_uploaded_image(filename: str):
    # Only server-generated names are accepted, keeping path traversal outside storage.
    if not STORED_IMAGE_PATTERN.fullmatch(filename):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    image_path = UPLOAD_DIRECTORY / filename
    if not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    media_type = {
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }[image_path.suffix]
    return FileResponse(
        image_path,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
