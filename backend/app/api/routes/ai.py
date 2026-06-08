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
from app.db.models.activity import ActivityType, NotificationType
from app.schemas.ai import (
    FeatureRequest, HyperparamRequest,
    ChatRequest, ModelRecommendRequest, AIResponse,
)
from app.core.dependencies import get_current_active_user
from app.core.security import decrypt_api_key
from app.services.ai import (
    get_ai_provider, get_feature_suggestions,
    get_hyperparameter_guide, chat_with_dataset,
    get_model_recommendation,
)
from app.services.activity import log_both

router = APIRouter()


async def _get_provider(provider_id, user, db):
    query = select(APIProvider).where(APIProvider.user_id == user.id)
    if provider_id:
        query = query.where(APIProvider.id == provider_id)
    else:
        query = query.where(APIProvider.is_default == True)
    result = await db.execute(query)
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(
            status_code=400,
            detail="No AI provider found. Add one in Settings → API Providers.",
        )
    key = decrypt_api_key(rec.encrypted_key)
    return get_ai_provider(rec.provider, key), rec


async def _get_dataset(dataset_id, user, db):
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == user.id,
        )
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if ds.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")
    if not ds.profile_summary:
        raise HTTPException(status_code=400, detail="Dataset has no profile data")
    return ds


@router.post("/features", response_model=AIResponse)
async def suggest_features(
    payload: FeatureRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(payload.dataset_id, current_user, db)
    provider, rec = await _get_provider(payload.provider_id, current_user, db)

    start  = time.time()
    result = await get_feature_suggestions(provider, dataset.profile_summary, payload.goal)
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id, user_id=current_user.id,
        analysis_type=AnalysisType.FEATURE_ENGINEERING,
        status=AnalysisStatus.COMPLETED,
        prompt=payload.goal, result=result,
        model_used=provider.model, processing_time_ms=elapsed,
    )
    db.add(analysis)

    n_features = len(result.get("feature_ideas", []))
    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.AI_FEATURES,
        activity_label="Generated feature ideas",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"{n_features} feature ideas for {dataset.name}",
        target=dataset.name,
        target_id=dataset.id,
        notif_desc=f"Goal: {payload.goal[:80]}",
        href=f"/dashboard/datasets/{dataset.id}",
        meta={"n_features": n_features, "elapsed_ms": elapsed},
    )

    await db.commit()
    return AIResponse(result=result, provider_used=rec.provider, model_used=provider.model, dataset_id=dataset.id)


@router.post("/hyperparams", response_model=AIResponse)
async def suggest_hyperparams(
    payload: HyperparamRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(payload.dataset_id, current_user, db)
    provider, rec = await _get_provider(payload.provider_id, current_user, db)

    start  = time.time()
    result = await get_hyperparameter_guide(provider, dataset.profile_summary, payload.model_type, payload.task_type)
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id, user_id=current_user.id,
        analysis_type=AnalysisType.HYPERPARAMETER_TUNING,
        status=AnalysisStatus.COMPLETED,
        prompt=f"{payload.model_type} for {payload.task_type}",
        result=result, model_used=provider.model, processing_time_ms=elapsed,
    )
    db.add(analysis)

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.AI_HYPERPARAMS,
        activity_label="Generated hyperparameter guide",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"{payload.model_type} tuning guide ready",
        target=dataset.name,
        target_id=dataset.id,
        notif_desc=f"Task: {payload.task_type} · Dataset: {dataset.name}",
        href=f"/dashboard/datasets/{dataset.id}",
        meta={"model": payload.model_type, "task": payload.task_type},
    )

    await db.commit()
    return AIResponse(result=result, provider_used=rec.provider, model_used=provider.model, dataset_id=dataset.id)


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(payload.dataset_id, current_user, db)
    provider, rec = await _get_provider(payload.provider_id, current_user, db)

    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    if payload.stream:
        async def generate():
            async for chunk in await chat_with_dataset(provider, dataset.profile_summary, messages, stream=True):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(generate(), media_type="text/event-stream")

    result = await chat_with_dataset(provider, dataset.profile_summary, messages, stream=False)

    analysis = Analysis(
        dataset_id=dataset.id, user_id=current_user.id,
        analysis_type=AnalysisType.AI_CHAT,
        status=AnalysisStatus.COMPLETED,
        prompt=messages[-1]["content"],
        result={"response": result}, model_used=provider.model,
    )
    db.add(analysis)

    from app.services.activity.service import log_activity as _log
    await _log(
        db,
        user_id=current_user.id,
        type=ActivityType.AI_CHAT,
        label="Chatted with dataset",
        target=dataset.name,
        target_id=dataset.id,
    )

    await db.commit()
    return {"response": result, "provider": rec.provider, "model": provider.model}


@router.post("/recommend-model", response_model=AIResponse)
async def recommend_model(
    payload: ModelRecommendRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(payload.dataset_id, current_user, db)
    provider, rec = await _get_provider(payload.provider_id, current_user, db)

    start  = time.time()
    result = await get_model_recommendation(provider, dataset.profile_summary, payload.goal)
    elapsed = int((time.time() - start) * 1000)

    analysis = Analysis(
        dataset_id=dataset.id, user_id=current_user.id,
        analysis_type=AnalysisType.MODEL_RECOMMENDATION,
        status=AnalysisStatus.COMPLETED,
        prompt=payload.goal, result=result,
        model_used=provider.model, processing_time_ms=elapsed,
    )
    db.add(analysis)

    top = result.get("recommendations", [{}])[0].get("model", "")
    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.AI_MODELS,
        activity_label="Got model recommendations",
        notif_type=NotificationType.INFO,
        notif_title=f"Top pick: {top} for {dataset.name}",
        target=dataset.name,
        target_id=dataset.id,
        notif_desc=payload.goal[:80],
        href=f"/dashboard/datasets/{dataset.id}",
    )

    await db.commit()
    return AIResponse(result=result, provider_used=rec.provider, model_used=provider.model, dataset_id=dataset.id)


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
    return result.scalars().all()


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
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Provider not found")
    key      = decrypt_api_key(rec.encrypted_key)
    provider = get_ai_provider(rec.provider, key)
    is_valid = await provider.validate_key()
    return {
        "provider": rec.provider,
        "is_valid": is_valid,
        "message": "API key is valid" if is_valid else "API key is invalid",
    }
