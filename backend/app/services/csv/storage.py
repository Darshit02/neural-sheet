import os
import aiofiles
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from loguru import logger
import uuid


ALLOWED_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
}

MAX_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def save_upload(file: UploadFile, user_id: int) -> dict:
    # Validate mime type
    if file.content_type not in ALLOWED_TYPES:
        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail=f"Only CSV files are allowed. Got: {file.content_type}"
            )

    # Read file
    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    # Save to disk
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(user_dir, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    logger.info(f"File saved: {file_path} ({file_size} bytes)")
    return {
        "file_path": file_path,
        "file_size_bytes": file_size,
        "original_filename": file.filename,
        "mime_type": file.content_type or "text/csv",
    }


def delete_file(file_path: str) -> None:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted: {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
