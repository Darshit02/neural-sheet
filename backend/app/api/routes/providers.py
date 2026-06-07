from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.api_provider import APIProvider, ProviderName
from app.schemas.api_provider import (
    AddProviderRequest, ProviderResponse,
    ProviderListItem, PROVIDER_META
)
from app.core.dependencies import get_current_active_user
from app.core.security import encrypt_api_key, decrypt_api_key
from typing import List
from loguru import logger

router = APIRouter()


@router.get("/available", response_model=List[ProviderListItem])
async def list_available_providers():
    """List all supported AI providers with metadata"""
    return [
        ProviderListItem(
            provider=provider,
            **meta
        )
        for provider, meta in PROVIDER_META.items()
    ]


@router.get("/", response_model=List[ProviderResponse])
async def list_my_providers(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIProvider).where(APIProvider.user_id == current_user.id)
    )
    providers = result.scalars().all()

    response = []
    for p in providers:
        try:
            key = decrypt_api_key(p.encrypted_key)
            masked = f"{key[:8]}...{key[-4:]}"
        except Exception:
            masked = "****...****"

        meta = PROVIDER_META.get(p.provider, {})
        response.append(ProviderResponse(
            id=p.id,
            provider=p.provider,
            label=p.label,
            is_active=p.is_active,
            is_default=p.is_default,
            masked_key=masked,
            meta=meta,
            created_at=p.created_at,
        ))
    return response


@router.post("/", response_model=ProviderResponse, status_code=201)
async def add_provider(
    payload: AddProviderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate key prefix
    meta = PROVIDER_META.get(payload.provider, {})
    prefix = meta.get("key_prefix")
    if prefix and not payload.api_key.startswith(prefix):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid API key format for {payload.provider}. Expected prefix: {prefix}",
        )

    # If setting as default, unset others
    if payload.is_default:
        result = await db.execute(
            select(APIProvider).where(
                APIProvider.user_id == current_user.id,
                APIProvider.is_default == True,
            )
        )
        for p in result.scalars().all():
            p.is_default = False

    provider = APIProvider(
        user_id=current_user.id,
        provider=payload.provider,
        label=payload.label or meta.get("label", payload.provider),
        encrypted_key=encrypt_api_key(payload.api_key),
        is_default=payload.is_default or False,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)

    key = decrypt_api_key(provider.encrypted_key)
    masked = f"{key[:8]}...{key[-4:]}"

    logger.info(f"Provider {payload.provider} added by {current_user.email}")
    return ProviderResponse(
        id=provider.id,
        provider=provider.provider,
        label=provider.label,
        is_active=provider.is_active,
        is_default=provider.is_default,
        masked_key=masked,
        meta=meta,
        created_at=provider.created_at,
    )


@router.patch("/{provider_id}/set-default")
async def set_default_provider(
    provider_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIProvider).where(
            APIProvider.id == provider_id,
            APIProvider.user_id == current_user.id,
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    all_result = await db.execute(
        select(APIProvider).where(APIProvider.user_id == current_user.id)
    )
    for p in all_result.scalars().all():
        p.is_default = p.id == provider_id

    await db.commit()
    return {"message": f"{provider.provider} set as default provider"}


@router.delete("/{provider_id}", status_code=204)
async def delete_provider(
    provider_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIProvider).where(
            APIProvider.id == provider_id,
            APIProvider.user_id == current_user.id,
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    await db.delete(provider)
    await db.commit()
