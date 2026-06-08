from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.db.models.activity import ActivityType, NotificationType


class ActivityResponse(BaseModel):
    id: int
    type: ActivityType
    label: str
    target: Optional[str]
    target_id: Optional[int]
    meta: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationResponse(BaseModel):
    id: int
    type: NotificationType
    title: str
    desc: Optional[str]
    read: bool
    href: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class MarkReadRequest(BaseModel):
    ids: Optional[list[int]] = None  # None = mark all
