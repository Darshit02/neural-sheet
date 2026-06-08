from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from loguru import logger

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.dataset import Dataset, DatasetStatus
from app.db.models.project import Project
from app.db.models.activity import ActivityType, NotificationType
from app.schemas.dataset import DatasetResponse, DatasetDetailResponse
from app.core.dependencies import get_current_active_user
from app.services.csv.storage import save_upload, delete_file
from app.services.csv.profiler import profile_dataset
from app.services.activity import log_activity, log_both

router = APIRouter()


@router.post("/upload", response_model=DatasetDetailResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if project_id:
        result = await db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Project not found")

    file_info = await save_upload(file, current_user.id)

    dataset = Dataset(
        owner_id=current_user.id,
        project_id=project_id,
        name=name or file.filename.replace(".csv", ""),
        original_filename=file_info["original_filename"],
        file_path=file_info["file_path"],
        file_size_bytes=file_info["file_size_bytes"],
        mime_type=file_info["mime_type"],
        status=DatasetStatus.PROCESSING,
    )
    db.add(dataset)
    await db.flush()

    try:
        profile = profile_dataset(file_info["file_path"])
        dataset.row_count      = profile["row_count"]
        dataset.column_count   = profile["column_count"]
        dataset.columns        = profile["columns"]
        dataset.dtypes         = profile["dtypes"]
        dataset.missing_values = profile["missing_values"]
        dataset.sample_data    = profile["sample_data"]
        dataset.numeric_stats  = profile["numeric_stats"]
        dataset.categorical_stats = profile["categorical_stats"]
        dataset.profile_summary = profile
        dataset.status          = DatasetStatus.READY

        missing_pct = round(
            sum(profile["missing_values"].values()) /
            max(profile["row_count"] * profile["column_count"], 1) * 100, 1
        )

        await log_both(
            db,
            user_id=current_user.id,
            activity_type=ActivityType.DATASET_PROFILED,
            activity_label="Uploaded and profiled",
            notif_type=NotificationType.SUCCESS,
            notif_title=f"Dataset ready — {dataset.name}",
            target=dataset.name,
            target_id=dataset.id,
            notif_desc=f"{profile['row_count']:,} rows · {profile['column_count']} cols · {missing_pct}% missing",
            href=f"/dashboard/datasets/{dataset.id}",
            meta={"row_count": profile["row_count"], "column_count": profile["column_count"]},
        )

        if missing_pct > 20:
            from app.services.activity.service import log_notification
            await log_notification(
                db,
                user_id=current_user.id,
                type=NotificationType.WARNING,
                title=f"High missing values in {dataset.name}",
                desc=f"{missing_pct}% of cells are missing — consider cleaning before analysis",
                href=f"/dashboard/datasets/{dataset.id}",
            )

    except Exception as e:
        logger.error(f"Profiling failed: {e}")
        dataset.status = DatasetStatus.FAILED
        dataset.error_message = str(e)
        from app.services.activity.service import log_notification
        await log_notification(
            db,
            user_id=current_user.id,
            type=NotificationType.ERROR,
            title=f"Failed to profile {dataset.name}",
            desc=str(e),
        )

    await db.commit()
    await db.refresh(dataset)
    return dataset


@router.get("/", response_model=List[DatasetResponse])
async def list_datasets(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Dataset).where(Dataset.owner_id == current_user.id)
    if project_id:
        query = query.where(Dataset.project_id == project_id)
    result = await db.execute(query.order_by(Dataset.created_at.desc()))
    return result.scalars().all()


@router.get("/{dataset_id}", response_model=DatasetDetailResponse)
async def get_dataset(
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
    return dataset


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
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

    name = dataset.name
    delete_file(dataset.file_path)
    await db.delete(dataset)

    await log_activity(
        db,
        user_id=current_user.id,
        type=ActivityType.DATASET_DELETED,
        label="Deleted dataset",
        target=name,
    )
    await db.commit()
