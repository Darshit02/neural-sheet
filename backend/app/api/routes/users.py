from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UpdateProfileRequest, UpdateApiKeyRequest, UserProfileResponse
from app.core.dependencies import get_current_active_user
from app.core.security import encrypt_api_key, decrypt_api_key
from loguru import logger

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    return {
        **current_user.__dict__,
        "has_api_key": current_user.encrypted_api_key is not None,
    }


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    await db.commit()
    return {
        **current_user.__dict__,
        "has_api_key": current_user.encrypted_api_key is not None,
    }


@router.post("/me/api-key")
async def save_api_key(
    payload: UpdateApiKeyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not payload.api_key.startswith("sk-ant-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Anthropic API key format. Must start with 'sk-ant-'",
        )

    current_user.encrypted_api_key = encrypt_api_key(payload.api_key)
    current_user.api_key_label = payload.label
    await db.commit()

    logger.info(f"API key saved for user: {current_user.email}")
    return {"message": "API key saved successfully", "label": payload.label}


@router.delete("/me/api-key")
async def delete_api_key(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.encrypted_api_key = None
    current_user.api_key_label = None
    await db.commit()
    return {"message": "API key removed successfully"}


@router.get("/me/api-key/verify")
async def verify_api_key(current_user: User = Depends(get_current_active_user)):
    if not current_user.encrypted_api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key found",
        )
    try:
        key = decrypt_api_key(current_user.encrypted_api_key)
        masked = f"{key[:12]}...{key[-4:]}"
        return {
            "has_key": True,
            "label": current_user.api_key_label,
            "masked_key": masked,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt API key",
        )
