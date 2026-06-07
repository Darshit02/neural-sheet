from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
import time

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.dataset import Dataset, DatasetStatus
from app.db.models.api_provider import APIProvider
from app.db.models.analysis import Analysis, AnalysisType, AnalysisStatus
from app.schemas.ai import (
    FeatureRequest, HyperparamRequest,
    ChatRequest, ModelRecommendRequest, AIResponse
)
from app.core.dependencies import get_current_active_user
from app.core.security import decrypt_api_key
from app.services.ai import (
    get_ai_provider, get_feature_suggestions,
    get_hyperparameter_guide, chat_with_dataset,
    get_model_recommendation,
)

router = APIRouter()


async def get_provider_and_key(
    provider_id: int,
    user: User,
    db: AsyncSession,
):
    """Helper to get AI provider instance"""
    if provider_id:
        result = await db.execute(
            select(APIProvider).where(
                APIProvider.id == provider_id,
                APIProvider.user_id == user.id,
            )
        )
        provider_record = result.scalar_one_or_none()
    else:
        result = await db.execute(
            select(APIProvider).where(
                APIProvider.user_id == user.id,
                APIProvider.is_default == True,
            )
        )
        provider_record = result.scalar_one_or_none()

    if not provider_record:
        raise HTTPException(
            status_code=400,
            detail="No AI provider found. Please add an API key in Settings → API Providers.",
        )

    api_key = decrypt_api_key(provider_record.encrypted_key)
    provider = get_ai_provider(provider_record.provider, api_key)
    return provider, provider_record


async def get_dataset_or_404(dataset_id: int, user: User, db: AsyncSession) -> Dataset:
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == user.id,
        )
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready yet")
    if not dataset.profile_summary:
        raise HTTPException(status_code=400, detail="Dataset has no profile data")
    return dataset


@router.post("/features", response_model=AIResponse)
async def suggest_features(
    payload: FeatureRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await get_dataset_or_404(payload.dataset_id, current_user, db)
    provider, provider_record = await get_provider_and_key(
        payload.provider_id, current_user, db
    )

    start = time.time()
    result = await get_feature_suggestions(provider, dataset.profile_summary, payload.goal)
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id,
        user_id=current_user.id,
        analysis_type=AnalysisType.FEATURE_ENGINEERING,
        status=AnalysisStatus.COMPLETED,
        prompt=payload.goal,
        result=result,
        model_used=provider.model,
        processing_time_ms=elapsed,
    )
    db.add(analysis)
    await db.commit()

    logger.info(f"Feature suggestions generated for dataset {dataset.id} in {elapsed}ms")
    return AIResponse(
        result=result,
        provider_used=provider_record.provider,
        model_used=provider.model,
        dataset_id=dataset.id,
    )


@router.post("/hyperparams", response_model=AIResponse)
async def suggest_hyperparams(
    payload: HyperparamRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await get_dataset_or_404(payload.dataset_id, current_user, db)
    provider, provider_record = await get_provider_and_key(
        payload.provider_id, current_user, db
    )

    start = time.time()
    result = await get_hyperparameter_guide(
        provider, dataset.profile_summary, payload.model_type, payload.task_type
    )
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id,
        user_id=current_user.id,
        analysis_type=AnalysisType.HYPERPARAMETER_TUNING,
        status=AnalysisStatus.COMPLETED,
        prompt=f"{payload.model_type} for {payload.task_type}",
        result=result,
        model_used=provider.model,
        processing_time_ms=elapsed,
    )
    db.add(analysis)
    await db.commit()

    logger.info(f"Hyperparams generated for dataset {dataset.id} in {elapsed}ms")
    return AIResponse(
        result=result,
        provider_used=provider_record.provider,
        model_used=provider.model,
        dataset_id=dataset.id,
    )


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await get_dataset_or_404(payload.dataset_id, current_user, db)
    provider, provider_record = await get_provider_and_key(
        payload.provider_id, current_user, db
    )

    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    if payload.stream:
        async def generate():
            async for chunk in await chat_with_dataset(
                provider, dataset.profile_summary, messages, stream=True
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    result = await chat_with_dataset(
        provider, dataset.profile_summary, messages, stream=False
    )

    analysis = Analysis(
        dataset_id=dataset.id,
        user_id=current_user.id,
        analysis_type=AnalysisType.AI_CHAT,
        status=AnalysisStatus.COMPLETED,
        prompt=messages[-1]["content"],
        result={"response": result},
        model_used=provider.model,
    )
    db.add(analysis)
    await db.commit()

    return {"response": result, "provider": provider_record.provider, "model": provider.model}


@router.post("/recommend-model", response_model=AIResponse)
async def recommend_model(
    payload: ModelRecommendRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await get_dataset_or_404(payload.dataset_id, current_user, db)
    provider, provider_record = await get_provider_and_key(
        payload.provider_id, current_user, db
    )

    start = time.time()
    result = await get_model_recommendation(provider, dataset.profile_summary, payload.goal)
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id,
        user_id=current_user.id,
        analysis_type=AnalysisType.MODEL_RECOMMENDATION,
        status=AnalysisStatus.COMPLETED,
        prompt=payload.goal,
        result=result,
        model_used=provider.model,
        processing_time_ms=elapsed,
    )
    db.add(analysis)
    await db.commit()

    return AIResponse(
        result=result,
        provider_used=provider_record.provider,
        model_used=provider.model,
        dataset_id=dataset.id,
    )


@router.get("/history/{dataset_id}")
async def get_analysis_history(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Analysis).where(
            Analysis.dataset_id == dataset_id,
            Analysis.user_id == current_user.id,
        ).order_by(Analysis.created_at.desc())
    )
    analyses = result.scalars().all()
    return analyses


@router.post("/validate-provider/{provider_id}")
async def validate_provider(
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
    provider_record = result.scalar_one_or_none()
    if not provider_record:
        raise HTTPException(status_code=404, detail="Provider not found")

    api_key = decrypt_api_key(provider_record.encrypted_key)
    provider = get_ai_provider(provider_record.provider, api_key)
    is_valid = await provider.validate_key()

    return {
        "provider": provider_record.provider,
        "is_valid": is_valid,
        "message": "API key is valid" if is_valid else "API key is invalid",
    }
