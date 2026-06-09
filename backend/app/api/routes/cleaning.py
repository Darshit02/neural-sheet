import os
import io
import uuid
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from loguru import logger

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.dataset import Dataset, DatasetStatus
from app.db.models.activity import ActivityType, NotificationType
from app.core.dependencies import get_current_active_user
from app.services.csv.cleaner import apply_cleaning_ops, get_cleaning_suggestions
from app.services.csv.profiler import profile_dataset
from app.services.activity import log_both

router = APIRouter()


class CleaningOperation(BaseModel):
    type: str
    column: Optional[str] = None
    value: Optional[Any] = None
    new_name: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    subset: Optional[List[str]] = None
    z: Optional[float] = 3.0


class ApplyCleaningRequest(BaseModel):
    operations: List[CleaningOperation]
    save_as_new: bool = False
    new_name: Optional[str] = None


@router.get("/{dataset_id}/suggestions")
async def get_suggestions(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id,
        )
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not dataset.profile_summary:
        raise HTTPException(status_code=400, detail="Dataset not profiled yet")

    suggestions = get_cleaning_suggestions(dataset.profile_summary)
    return {"suggestions": suggestions, "dataset_id": dataset_id}


@router.post("/{dataset_id}/preview")
async def preview_cleaning(
    dataset_id: int,
    payload: ApplyCleaningRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply operations and return preview (first 10 rows + stats diff)."""
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id,
        )
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    ops = [op.model_dump() for op in payload.operations]

    try:
        df_clean, log = apply_cleaning_ops(dataset.file_path, ops)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleaning failed: {e}")

    # Stats comparison
    import numpy as np
    orig_df = pd.read_csv(dataset.file_path)
    orig_missing = int(orig_df.isnull().sum().sum())
    new_missing  = int(df_clean.isnull().sum().sum())
    orig_dups    = int(orig_df.duplicated().sum())
    new_dups     = int(df_clean.duplicated().sum())

    def safe_val(v):
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, (np.floating,)): return None if np.isnan(v) else float(v)
        if pd.isna(v) if not isinstance(v, (list, dict)) else False: return None
        return v

    sample = df_clean.head(10).replace({np.nan: None}).to_dict(orient="records")
    sample = [{k: safe_val(v) for k, v in row.items()} for row in sample]

    return {
        "preview_rows": sample,
        "columns": df_clean.columns.tolist(),
        "original_shape": [len(orig_df), len(orig_df.columns)],
        "cleaned_shape":  [len(df_clean), len(df_clean.columns)],
        "rows_removed":   len(orig_df) - len(df_clean),
        "cols_removed":   len(orig_df.columns) - len(df_clean.columns),
        "missing_before": orig_missing,
        "missing_after":  new_missing,
        "dups_before":    orig_dups,
        "dups_after":     new_dups,
        "operations_log": log,
    }


@router.post("/{dataset_id}/apply")
async def apply_and_save(
    dataset_id: int,
    payload: ApplyCleaningRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply operations and save as new dataset."""
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id,
        )
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    ops = [op.model_dump() for op in payload.operations]

    try:
        df_clean, log = apply_cleaning_ops(dataset.file_path, ops)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleaning failed: {e}")

    # Save cleaned file
    from app.core.config import settings
    user_dir   = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    new_name   = payload.new_name or f"{dataset.name}_cleaned"
    filename   = f"{uuid.uuid4().hex}_{new_name}.csv"
    file_path  = os.path.join(user_dir, filename)
    df_clean.to_csv(file_path, index=False)

    # Profile the new dataset
    profile = profile_dataset(file_path)

    new_dataset = Dataset(
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
    db.add(new_dataset)
    await db.flush()

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.DATASET_PROFILED,
        activity_label="Created cleaned dataset",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"Cleaned dataset saved — {new_name}",
        target=new_name,
        target_id=new_dataset.id,
        notif_desc=f"{len(log)} operations applied · {profile['row_count']:,} rows",
        href=f"/dashboard/datasets/{new_dataset.id}",
        meta={"operations": len(log), "source_id": dataset_id},
    )

    await db.commit()
    await db.refresh(new_dataset)

    return {
        "dataset_id": new_dataset.id,
        "name": new_name,
        "rows": profile["row_count"],
        "columns": profile["column_count"],
        "operations_log": log,
        "message": f"Cleaned dataset saved as '{new_name}'",
    }


@router.post("/{dataset_id}/download")
async def download_cleaned(
    dataset_id: int,
    payload: ApplyCleaningRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply operations and stream as CSV download."""
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.owner_id == current_user.id,
        )
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    ops = [op.model_dump() for op in payload.operations]

    try:
        df_clean, log = apply_cleaning_ops(dataset.file_path, ops)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleaning failed: {e}")

    buf = io.StringIO()
    df_clean.to_csv(buf, index=False)
    buf.seek(0)

    filename = f"{dataset.name}_cleaned.csv"
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
