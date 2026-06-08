from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class ActivityType(str, enum.Enum):
    DATASET_UPLOADED   = "dataset_uploaded"
    DATASET_PROFILED   = "dataset_profiled"
    DATASET_DELETED    = "dataset_deleted"
    PROJECT_CREATED    = "project_created"
    PROJECT_DELETED    = "project_deleted"
    PROVIDER_ADDED     = "provider_added"
    PROVIDER_DELETED   = "provider_deleted"
    AI_FEATURES        = "ai_features"
    AI_HYPERPARAMS     = "ai_hyperparams"
    AI_CHAT            = "ai_chat"
    AI_MODELS          = "ai_models"
    VISUALIZATION      = "visualization"


class NotificationType(str, enum.Enum):
    SUCCESS = "success"
    ERROR   = "error"
    INFO    = "info"
    WARNING = "warning"


class Activity(Base):
    __tablename__ = "activities"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type       = Column(SAEnum(ActivityType), nullable=False)
    label      = Column(String(255), nullable=False)
    target     = Column(String(255), nullable=True)
    target_id  = Column(Integer, nullable=True)
    meta       = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type       = Column(SAEnum(NotificationType), nullable=False, default=NotificationType.INFO)
    title      = Column(String(255), nullable=False)
    desc       = Column(Text, nullable=True)
    read       = Column(Boolean, default=False, nullable=False)
    href       = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
