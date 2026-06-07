from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.db.models.dataset import DatasetStatus


class DatasetResponse(BaseModel):
    id: int
    name: str
    original_filename: str
    file_size_bytes: Optional[int]
    row_count: Optional[int]
    column_count: Optional[int]
    columns: Optional[List[str]]
    status: DatasetStatus
    project_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class DatasetDetailResponse(DatasetResponse):
    dtypes: Optional[Dict[str, str]]
    missing_values: Optional[Dict[str, int]]
    sample_data: Optional[List[Dict[str, Any]]]
    numeric_stats: Optional[Dict[str, Any]]
    categorical_stats: Optional[Dict[str, Any]]
    profile_summary: Optional[Dict[str, Any]]
