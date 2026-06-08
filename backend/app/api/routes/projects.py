from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.project import Project
from app.db.models.dataset import Dataset
from app.db.models.activity import ActivityType, NotificationType
from app.schemas.project import CreateProjectRequest, UpdateProjectRequest, ProjectResponse
from app.core.dependencies import get_current_active_user
from app.services.activity import log_activity, log_both
from typing import List
from loguru import logger

router = APIRouter()


def _to_response(project: Project, dataset_count: int) -> ProjectResponse:
    return ProjectResponse(
        **{c.name: getattr(project, c.name) for c in project.__table__.columns},
        dataset_count=dataset_count,
    )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(Project.owner_id == current_user.id)
    )
    projects = result.scalars().all()
    response = []
    for project in projects:
        cnt = await db.execute(
            select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
        )
        response.append(_to_response(project, cnt.scalar() or 0))
    return response


@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    payload: CreateProjectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        color=payload.color,
        icon=payload.icon,
    )
    db.add(project)
    await db.flush()

    await log_both(
        db,
        user_id=current_user.id,
        activity_type=ActivityType.PROJECT_CREATED,
        activity_label="Created project",
        notif_type=NotificationType.SUCCESS,
        notif_title=f"Project created — {project.name}",
        target=project.name,
        target_id=project.id,
        notif_desc="Start adding datasets to your new project.",
        href="/dashboard/projects",
    )

    await db.commit()
    await db.refresh(project)
    return _to_response(project, 0)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    cnt = await db.execute(
        select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
    )
    return _to_response(project, cnt.scalar() or 0)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: UpdateProjectRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    cnt = await db.execute(
        select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
    )
    return _to_response(project, cnt.scalar() or 0)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default project")

    name = project.name
    await db.delete(project)
    await log_activity(
        db,
        user_id=current_user.id,
        type=ActivityType.PROJECT_DELETED,
        label="Deleted project",
        target=name,
    )
    await db.commit()
