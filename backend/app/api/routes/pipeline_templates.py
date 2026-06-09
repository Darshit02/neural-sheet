from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.pipeline_template import PipelineTemplate
from app.core.dependencies import get_current_active_user

router = APIRouter()


class CreateTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    operations: List[Dict[str, Any]]
    is_public: bool = False


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    operations: Optional[List[Dict[str, Any]]] = None


@router.get("/")
async def list_templates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PipelineTemplate).where(
            (PipelineTemplate.user_id == current_user.id) |
            (PipelineTemplate.is_public == True)
        ).order_by(PipelineTemplate.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", status_code=201)
async def create_template(
    payload: CreateTemplateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    template = PipelineTemplate(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        operations=payload.operations,
        is_public=payload.is_public,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/{template_id}")
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PipelineTemplate).where(PipelineTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.user_id != current_user.id and not template.is_public:
        raise HTTPException(status_code=403, detail="Not authorized")
    return template


@router.patch("/{template_id}")
async def update_template(
    template_id: int,
    payload: UpdateTemplateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PipelineTemplate).where(
            PipelineTemplate.id == template_id,
            PipelineTemplate.user_id == current_user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(template, field, value)
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PipelineTemplate).where(
            PipelineTemplate.id == template_id,
            PipelineTemplate.user_id == current_user.id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()
