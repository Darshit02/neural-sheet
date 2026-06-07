from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.project import Project
from app.db.models.dataset import Dataset
from app.schemas.project import CreateProjectRequest, UpdateProjectRequest, ProjectResponse
from app.core.dependencies import get_current_active_user
from typing import List
from loguru import logger

router = APIRouter()


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
        count_result = await db.execute(
            select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
        )
        dataset_count = count_result.scalar() or 0
        response.append(ProjectResponse(
            **{c.name: getattr(project, c.name) for c in project.__table__.columns},
            dataset_count=dataset_count,
        ))
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
    await db.commit()
    await db.refresh(project)
    logger.info(f"Project created: {project.name} by {current_user.email}")
    return ProjectResponse(
        **{c.name: getattr(project, c.name) for c in project.__table__.columns},
        dataset_count=0,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count_result = await db.execute(
        select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
    )
    dataset_count = count_result.scalar() or 0
    return ProjectResponse(
        **{c.name: getattr(project, c.name) for c in project.__table__.columns},
        dataset_count=dataset_count,
    )


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
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    count_result = await db.execute(
        select(func.count(Dataset.id)).where(Dataset.project_id == project.id)
    )
    dataset_count = count_result.scalar() or 0
    return ProjectResponse(
        **{c.name: getattr(project, c.name) for c in project.__table__.columns},
        dataset_count=dataset_count,
    )


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default project")

    await db.delete(project)
    await db.commit()
