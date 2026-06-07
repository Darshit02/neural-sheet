from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db.models.api_provider import ProviderName


class FeatureRequest(BaseModel):
    dataset_id: int
    goal: str
    provider_id: Optional[int] = None
    model: Optional[str] = None


class HyperparamRequest(BaseModel):
    dataset_id: int
    model_type: str
    task_type: str = "classification"
    provider_id: Optional[int] = None
    model: Optional[str] = None


class ChatMessage(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    dataset_id: int
    messages: List[ChatMessage]
    provider_id: Optional[int] = None
    model: Optional[str] = None
    stream: Optional[bool] = False


class ModelRecommendRequest(BaseModel):
    dataset_id: int
    goal: str
    provider_id: Optional[int] = None


class AIResponse(BaseModel):
    result: Dict[str, Any]
    provider_used: str
    model_used: str
    dataset_id: int
