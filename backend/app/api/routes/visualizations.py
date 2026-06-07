from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from loguru import logger

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.dataset import Dataset, DatasetStatus
from app.core.dependencies import get_current_active_user
from app.services.csv.visualizer import (
    get_overview_charts,
    get_distribution_data,
    get_bar_data,
    get_correlation_matrix,
    get_missing_values_data,
    get_scatter_data,
    get_boxplot_data,
    get_time_series_data,
)
import pandas as pd

router = APIRouter()


async def get_dataset_file(
    dataset_id: int,
    user: User,
    db: AsyncSession,
) -> tuple[Dataset, pd.DataFrame]:
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
        raise HTTPException(status_code=400, detail="Dataset is not ready")
    try:
        df = pd.read_csv(dataset.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")
    return dataset, df


@router.get("/{dataset_id}/overview")
async def get_overview(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all charts overview for a dataset"""
    dataset, _ = await get_dataset_file(dataset_id, current_user, db)
    try:
        charts = get_overview_charts(dataset.file_path)
        return {"dataset_id": dataset_id, "charts": charts}
    except Exception as e:
        logger.error(f"Overview charts failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dataset_id}/distribution/{column}")
async def get_distribution(
    dataset_id: int,
    column: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found")
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(status_code=400, detail=f"Column '{column}' is not numeric")
    return get_distribution_data(df, column)


@router.get("/{dataset_id}/bar/{column}")
async def get_bar_chart(
    dataset_id: int,
    column: str,
    top_n: int = Query(default=15, ge=5, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found")
    return get_bar_data(df, column, top_n)


@router.get("/{dataset_id}/correlation")
async def get_correlation(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    return get_correlation_matrix(df)


@router.get("/{dataset_id}/missing-values")
async def get_missing(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    return get_missing_values_data(df)


@router.get("/{dataset_id}/scatter")
async def get_scatter(
    dataset_id: int,
    x: str = Query(...),
    y: str = Query(...),
    color: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    for col in [x, y]:
        if col not in df.columns:
            raise HTTPException(status_code=404, detail=f"Column '{col}' not found")
    return get_scatter_data(df, x, y, color)


@router.get("/{dataset_id}/boxplot/{column}")
async def get_boxplot(
    dataset_id: int,
    column: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found")
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(status_code=400, detail=f"Column '{column}' is not numeric")
    return get_boxplot_data(df, column)


@router.get("/{dataset_id}/timeseries")
async def get_timeseries(
    dataset_id: int,
    date_col: str = Query(...),
    value_col: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    for col in [date_col, value_col]:
        if col not in df.columns:
            raise HTTPException(status_code=404, detail=f"Column '{col}' not found")
    return get_time_series_data(df, date_col, value_col)


@router.get("/{dataset_id}/columns")
async def get_columns_info(
    dataset_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get column info for chart builder"""
    dataset, df = await get_dataset_file(dataset_id, current_user, db)
    import numpy as np
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # Detect datetime columns
    date_cols = []
    for col in df.columns:
        try:
            pd.to_datetime(df[col].head(10))
            date_cols.append(col)
        except Exception:
            pass

    return {
        "all_columns": df.columns.tolist(),
        "numeric_columns": numeric_cols,
        "categorical_columns": cat_cols,
        "datetime_columns": date_cols,
        "row_count": len(df),
    }
