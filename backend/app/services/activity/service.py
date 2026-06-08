from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.activity import Activity, ActivityType, Notification, NotificationType
from loguru import logger
from typing import Optional, Dict, Any


async def log_activity(
    db: AsyncSession,
    user_id: int,
    type: ActivityType,
    label: str,
    target: Optional[str] = None,
    target_id: Optional[int] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Activity:
    activity = Activity(
        user_id=user_id,
        type=type,
        label=label,
        target=target,
        target_id=target_id,
        meta=meta or {},
    )
    db.add(activity)
    await db.flush()
    logger.debug(f"Activity logged: {type} for user {user_id}")
    return activity


async def log_notification(
    db: AsyncSession,
    user_id: int,
    type: NotificationType,
    title: str,
    desc: Optional[str] = None,
    href: Optional[str] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        desc=desc,
        href=href,
        read=False,
    )
    db.add(notification)
    await db.flush()
    return notification


async def log_both(
    db: AsyncSession,
    user_id: int,
    activity_type: ActivityType,
    activity_label: str,
    notif_type: NotificationType,
    notif_title: str,
    target: Optional[str] = None,
    target_id: Optional[int] = None,
    notif_desc: Optional[str] = None,
    href: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
):
    await log_activity(db, user_id, activity_type, activity_label, target, target_id, meta)
    await log_notification(db, user_id, notif_type, notif_title, notif_desc, href)
