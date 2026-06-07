from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Text, Float, JSON,
    ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class DatasetStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)

    # File Info
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    # Dataset Metadata
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    columns = Column(JSON, nullable=True)
    dtypes = Column(JSON, nullable=True)
    missing_values = Column(JSON, nullable=True)
    sample_data = Column(JSON, nullable=True)

    # Profile Summary
    profile_summary = Column(JSON, nullable=True)
    numeric_stats = Column(JSON, nullable=True)
    categorical_stats = Column(JSON, nullable=True)

    # Status
    status = Column(SAEnum(DatasetStatus), default=DatasetStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    task_id = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="datasets")
    project = relationship("Project", back_populates="datasets")
    analyses = relationship("Analysis", back_populates="dataset", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dataset {self.name} ({self.status})>"
