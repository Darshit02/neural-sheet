import os
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from loguru import logger

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.dataset import Dataset, DatasetStatus
from app.db.models.api_provider import APIProvider
from app.db.models.activity import ActivityType, NotificationType
from app.core.dependencies import get_current_active_user
from app.core.security import decrypt_api_key
from app.services.ai.factory import get_ai_provider
from app.services.ai.report import generate_report
from app.services.csv.transformer import apply_transformations, preview_transform
from app.services.csv.merger import merge_datasets, get_join_suggestions
from app.services.csv.schema_validator import validate_schema
from app.services.csv.profiler import profile_dataset
from app.services.activity import log_both

router = APIRouter()


# ─── helpers ────────────────────────────────────────────────────────────────

async def _get_dataset(dataset_id: int, user: User, db: AsyncSession) -> Dataset:
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == user.id,
        )
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds


async def _get_provider(user: User, db: AsyncSession):
    result = await db.execute(
        select(APIProvider).where(
            APIProvider.user_id == user.id,
            APIProvider.is_default == True,
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        result = await db.execute(
            select(APIProvider).where(APIProvider.user_id == user.id)
        )
        rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=400, detail="No AI provider configured")
    key = decrypt_api_key(rec.encrypted_key)
    return get_ai_provider(rec.provider, key), rec


# ─── AI Report ──────────────────────────────────────────────────────────────

@router.post("/report/{dataset_id}")
async def generate_dataset_report(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(dataset_id, current_user, db)
    provider, rec = await _get_provider(current_user, db)

    if not dataset.profile_summary:
        raise HTTPException(status_code=400, detail="Dataset not profiled yet")

    report_md = await generate_report(provider, dataset.profile_summary, dataset.name)

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.AI_FEATURES,
        activity_label="Generated AI report",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"Report ready — {dataset.name}",
        target=dataset.name,
        target_id=dataset.id,
        notif_desc="Full analysis report generated",
        href=f"/dashboard/datasets/{dataset.id}",
    )
    await db.commit()

    return {"report": report_md, "dataset_name": dataset.name, "provider": rec.provider}


@router.post("/report/{dataset_id}/download")
async def download_report(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(dataset_id, current_user, db)
    provider, _ = await _get_provider(current_user, db)

    if not dataset.profile_summary:
        raise HTTPException(status_code=400, detail="Dataset not profiled yet")

    report_md = await generate_report(provider, dataset.profile_summary, dataset.name)
    buf = io.BytesIO(report_md.encode())

    return StreamingResponse(
        buf,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{dataset.name}_report.md"'},
    )


# ─── Column Transformer ──────────────────────────────────────────────────────

class TransformRequest(BaseModel):
    transformations: List[Dict[str, Any]]
    save_as_new: bool = False
    new_name: Optional[str] = None


@router.post("/transform/{dataset_id}/preview")
async def preview_transformation(
    dataset_id: int,
    payload: TransformRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await _get_dataset(dataset_id, current_user, db)
    try:
        result = preview_transform(dataset.file_path, payload.transformations)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transform/{dataset_id}/apply")
async def apply_transformation(
    dataset_id: int,
    payload: TransformRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import settings
    import pandas as pd

    dataset  = await _get_dataset(dataset_id, current_user, db)
    df, log  = apply_transformations(dataset.file_path, payload.transformations)

    user_dir  = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    new_name  = payload.new_name or f"{dataset.name}_transformed"
    filename  = f"{uuid.uuid4().hex}_{new_name}.csv"
    file_path = os.path.join(user_dir, filename)
    df.to_csv(file_path, index=False)

    profile = profile_dataset(file_path)
    new_ds = Dataset(
        owner_id=current_user.id,
        project_id=dataset.project_id,
        name=new_name,
        original_filename=f"{new_name}.csv",
        file_path=file_path,
        file_size_bytes=os.path.getsize(file_path),
        mime_type="text/csv",
        status=DatasetStatus.READY,
        row_count=profile["row_count"],
        column_count=profile["column_count"],
        columns=profile["columns"],
        dtypes=profile["dtypes"],
        missing_values=profile["missing_values"],
        sample_data=profile["sample_data"],
        numeric_stats=profile["numeric_stats"],
        categorical_stats=profile["categorical_stats"],
        profile_summary=profile,
    )
    db.add(new_ds)
    await db.flush()

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.DATASET_PROFILED,
        activity_label="Transformed dataset",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"Transformed dataset saved — {new_name}",
        target=new_name, target_id=new_ds.id,
        notif_desc=f"{len(log)} transformations applied",
        href=f"/dashboard/datasets/{new_ds.id}",
    )
    await db.commit()

    return {"dataset_id": new_ds.id, "name": new_name, "operations_log": log}


@router.post("/transform/{dataset_id}/download")
async def download_transformed(
    dataset_id: int,
    payload: TransformRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset  = await _get_dataset(dataset_id, current_user, db)
    df, _log = apply_transformations(dataset.file_path, payload.transformations)

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{dataset.name}_transformed.csv"'},
    )


# ─── Dataset Merge ───────────────────────────────────────────────────────────

class MergeRequest(BaseModel):
    right_dataset_id: int
    left_on: List[str]
    right_on: List[str]
    how: str = "inner"
    new_name: Optional[str] = None


@router.get("/merge/{dataset_id}/suggestions")
async def merge_suggestions(
    dataset_id: int,
    right_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    left  = await _get_dataset(dataset_id, current_user, db)
    right = await _get_dataset(right_id, current_user, db)

    import pandas as pd
    left_cols  = pd.read_csv(left.file_path, nrows=0).columns.tolist()
    right_cols = pd.read_csv(right.file_path, nrows=0).columns.tolist()

    suggestions = get_join_suggestions(left_cols, right_cols)
    return {
        "left_columns":  left_cols,
        "right_columns": right_cols,
        "suggestions":   suggestions,
    }


@router.post("/merge/{dataset_id}/preview")
async def preview_merge(
    dataset_id: int,
    payload: MergeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    left  = await _get_dataset(dataset_id, current_user, db)
    right = await _get_dataset(payload.right_dataset_id, current_user, db)

    try:
        _, sample, stats = merge_datasets(
            left.file_path, right.file_path,
            payload.left_on, payload.right_on, payload.how,
        )
        return {"preview_rows": sample, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/merge/{dataset_id}/apply")
async def apply_merge(
    dataset_id: int,
    payload: MergeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import settings

    left  = await _get_dataset(dataset_id, current_user, db)
    right = await _get_dataset(payload.right_dataset_id, current_user, db)

    merged_df, _, stats = merge_datasets(
        left.file_path, right.file_path,
        payload.left_on, payload.right_on, payload.how,
    )

    user_dir  = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    new_name  = payload.new_name or f"{left.name}_{payload.how}_join_{right.name}"
    filename  = f"{uuid.uuid4().hex}_{new_name}.csv"
    file_path = os.path.join(user_dir, filename)
    merged_df.to_csv(file_path, index=False)

    profile = profile_dataset(file_path)
    new_ds  = Dataset(
        owner_id=current_user.id,
        project_id=left.project_id,
        name=new_name,
        original_filename=f"{new_name}.csv",
        file_path=file_path,
        file_size_bytes=os.path.getsize(file_path),
        mime_type="text/csv",
        status=DatasetStatus.READY,
        row_count=profile["row_count"],
        column_count=profile["column_count"],
        columns=profile["columns"],
        dtypes=profile["dtypes"],
        missing_values=profile["missing_values"],
        sample_data=profile["sample_data"],
        numeric_stats=profile["numeric_stats"],
        categorical_stats=profile["categorical_stats"],
        profile_summary=profile,
    )
    db.add(new_ds)
    await db.flush()

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.DATASET_PROFILED,
        activity_label="Merged datasets",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"Merged dataset saved — {new_name}",
        target=new_name, target_id=new_ds.id,
        notif_desc=f"{stats['merged_rows']:,} rows · {payload.how} join",
        href=f"/dashboard/datasets/{new_ds.id}",
    )
    await db.commit()

    return {"dataset_id": new_ds.id, "name": new_name, "stats": stats}


# ─── Schema Validator ────────────────────────────────────────────────────────

class SchemaValidateRequest(BaseModel):
    rules: List[Dict[str, Any]]
    schema_name: Optional[str] = None


@router.post("/schema/{dataset_id}/validate")
async def validate_dataset_schema(
    dataset_id: int,
    payload: SchemaValidateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset = await _get_dataset(dataset_id, current_user, db)
    try:
        result = validate_schema(dataset.file_path, payload.rules)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/schema/{dataset_id}/save")
async def save_schema_rules(
    dataset_id: int,
    payload: SchemaValidateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.db.models.schema_rule import SchemaRule

    dataset = await _get_dataset(dataset_id, current_user, db)
    rule = SchemaRule(
        user_id=current_user.id,
        name=payload.schema_name or f"{dataset.name} schema",
        rules=payload.rules,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {"id": rule.id, "name": rule.name, "message": "Schema saved"}


@router.get("/schema/saved")
async def list_saved_schemas(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.db.models.schema_rule import SchemaRule
    result = await db.execute(
        select(SchemaRule).where(SchemaRule.user_id == current_user.id)
    )
    return result.scalars().all()
