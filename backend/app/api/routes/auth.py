from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import random
from loguru import logger

from app.db.session import get_db
from app.db.models.user import User, AuthProvider
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshTokenRequest, UserResponse, ChangePasswordRequest,
)
from app.services.auth import (
    generate_tokens, get_password_hash,
    check_password, get_google_auth_url, exchange_google_code,
)
from app.core.security import verify_refresh_token
from app.core.dependencies import get_current_active_user
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        avatar_url=f"/profile-images/{random.randint(1, 9)}.jpeg",
        auth_provider=AuthProvider.EMAIL,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    tokens = generate_tokens(user.id, user.email)
    user.refresh_token = tokens["refresh_token"]
    await db.commit()

    logger.info(f"New user registered: {user.email}")
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not check_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    tokens = generate_tokens(user.id, user.email)
    user.refresh_token = tokens["refresh_token"]
    user.last_login_at = datetime.utcnow()
    await db.commit()

    logger.info(f"User logged in: {user.email}")
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    token_data = verify_refresh_token(payload.refresh_token)
    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == int(token_data["sub"])))
    user = result.scalar_one_or_none()

    if not user or user.refresh_token != payload.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token mismatch")

    tokens = generate_tokens(user.id, user.email)
    user.refresh_token = tokens["refresh_token"]
    await db.commit()
    return tokens


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.refresh_token = None
    await db.commit()
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select as sel
    from app.db.models.api_provider import APIProvider
    result = await db.execute(
        sel(APIProvider).where(APIProvider.user_id == current_user.id)
    )
    has_api_key = result.scalar_one_or_none() is not None

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "tier": current_user.tier,
        "auth_provider": current_user.auth_provider,
        "has_api_key": has_api_key,
    }


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not check_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.get("/google")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google OAuth not configured")
    return {"url": get_google_auth_url()}


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    google_user = await exchange_google_code(code)
    if not google_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to authenticate with Google")

    result = await db.execute(select(User).where(User.google_id == google_user["id"]))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == google_user["email"]))
        user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=google_user["email"],
            full_name=google_user.get("name"),
            avatar_url=google_user.get("picture") or f"/profile-images/{random.randint(1, 9)}.jpeg",
            google_id=google_user["id"],
            auth_provider=AuthProvider.GOOGLE,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()

    tokens = generate_tokens(user.id, user.email)
    user.refresh_token = tokens["refresh_token"]
    await db.commit()
    return tokens
