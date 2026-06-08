from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.activity import Activity, Notification
from app.schemas.activity import ActivityResponse, NotificationResponse, MarkReadRequest
from app.core.dependencies import get_current_active_user

router = APIRouter()


@router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    limit: int = Query(default=20, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.read == False)
    query = query.order_by(Notification.created_at.desc()).limit(30)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func as sqlfunc
    result = await db.execute(
        select(sqlfunc.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.read == False,
        )
    )
    return {"count": result.scalar() or 0}


@router.post("/notifications/mark-read")
async def mark_notifications_read(
    payload: MarkReadRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(read=True)
    )
    if payload.ids:
        query = query.where(Notification.id.in_(payload.ids))
    await db.execute(query)
    await db.commit()
    return {"message": "Marked as read"}


@router.delete("/notifications/{notif_id}")
async def delete_notification(
    notif_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        await db.delete(notif)
        await db.commit()
    return {"message": "Deleted"}


@router.delete("/notifications")
async def clear_all_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import delete
    await db.execute(
        delete(Notification).where(Notification.user_id == current_user.id)
    )
    await db.commit()
    return {"message": "All notifications cleared"}
