import re

import pytest

from app.routers import uploads
from tests.database_setup import client

pytestmark = [pytest.mark.api, pytest.mark.security]

PNG_CONTENT = b"\x89PNG\r\n\x1a\n" + b"eventsmister-image"


def test_authenticated_user_can_upload_and_retrieve_an_image(
    tmp_path,
    monkeypatch,
    auth_headers,
):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)

    response = client.post(
        "/uploads/images",
        headers=auth_headers,
        files={"file": ("my-event.png", PNG_CONTENT, "image/png")},
    )

    assert response.status_code == 200
    image_url = response.json()["url"]
    filename = image_url.rsplit("/", 1)[-1]
    assert re.fullmatch(r"[0-9a-f]{32}\.png", filename)
    assert (tmp_path / filename).read_bytes() == PNG_CONTENT

    image_response = client.get(f"/uploads/{filename}")
    assert image_response.status_code == 200
    assert image_response.content == PNG_CONTENT
    assert image_response.headers["content-type"] == "image/png"
    assert image_response.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert image_response.headers["x-content-type-options"] == "nosniff"


def test_upload_requires_authentication():
    response = client.post(
        "/uploads/images",
        files={"file": ("event.png", PNG_CONTENT, "image/png")},
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    ("content", "media_type", "extension"),
    [
        (b"\xff\xd8\xffjpeg-content", "image/jpeg", ".jpg"),
        (b"RIFF\x04\x00\x00\x00WEBPcontent", "image/webp", ".webp"),
    ],
)
def test_upload_detects_each_supported_binary_format(
    content,
    media_type,
    extension,
    tmp_path,
    monkeypatch,
    auth_headers,
):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)

    response = client.post(
        "/uploads/images",
        headers=auth_headers,
        files={"file": (f"photo{extension}", content, media_type)},
    )

    assert response.status_code == 200
    assert response.json()["url"].endswith(extension)


@pytest.mark.parametrize(
    ("filename", "content", "media_type", "expected_detail"),
    [
        ("event.svg", b"<svg></svg>", "image/svg+xml", "Upload a JPEG, PNG, or WebP image"),
        ("event.png", b"not-an-image", "image/png", "The file content does not match its image type"),
        ("event.png", b"\xff\xd8\xffdata", "image/png", "The file content does not match its image type"),
    ],
)
def test_upload_rejects_unsupported_or_spoofed_files(
    filename,
    content,
    media_type,
    expected_detail,
    tmp_path,
    monkeypatch,
    auth_headers,
):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)

    response = client.post(
        "/uploads/images",
        headers=auth_headers,
        files={"file": (filename, content, media_type)},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == expected_detail
    assert list(tmp_path.iterdir()) == []


def test_upload_rejects_images_larger_than_five_megabytes(
    tmp_path,
    monkeypatch,
    auth_headers,
):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)
    oversized_image = b"\x89PNG\r\n\x1a\n" + b"x" * uploads.MAX_IMAGE_BYTES

    response = client.post(
        "/uploads/images",
        headers=auth_headers,
        files={"file": ("large.png", oversized_image, "image/png")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Image must be 5 MB or smaller"
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize(
    "filename",
    ["../secret.png", "not-generated.png", "a" * 32 + ".svg", "a" * 32 + ".png"],
)
def test_image_serving_rejects_untrusted_paths(filename, tmp_path, monkeypatch):
    monkeypatch.setattr(uploads, "UPLOAD_DIRECTORY", tmp_path)

    response = client.get(f"/uploads/{filename}")

    assert response.status_code == 404
