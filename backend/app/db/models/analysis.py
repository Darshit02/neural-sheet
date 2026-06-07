from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class AnalysisType(str, enum.Enum):
    PROFILING = "profiling"
    FEATURE_ENGINEERING = "feature_engineering"
    HYPERPARAMETER_TUNING = "hyperparameter_tuning"
    AI_CHAT = "ai_chat"
    VISUALIZATION = "visualization"
    CLEANING_SUGGESTIONS = "cleaning_suggestions"
    MODEL_RECOMMENDATION = "model_recommendation"


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Analysis Info
    analysis_type = Column(SAEnum(AnalysisType), nullable=False)
    status = Column(
        SAEnum(AnalysisStatus),
        default=AnalysisStatus.PENDING,
        nullable=False
    )

    # Input
    prompt = Column(Text, nullable=True)          # user's question/goal
    parameters = Column(JSON, nullable=True)      # extra config

    # Output
    result = Column(JSON, nullable=True)          # AI response / analysis result
    error_message = Column(Text, nullable=True)

    # AI Metadata
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # Celery Task
    task_id = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    dataset = relationship("Dataset", back_populates="analyses")

    def __repr__(self):
        return f"<Analysis {self.analysis_type} ({self.status})>"
