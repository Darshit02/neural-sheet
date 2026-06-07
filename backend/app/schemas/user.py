from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.models.user import UserTier


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateApiKeyRequest(BaseModel):
    api_key: str
    label: Optional[str] = "My Anthropic Key"

    @classmethod
    def validate_key(cls, v):
        if not v.startswith("sk-ant-"):
            raise ValueError("Invalid Anthropic API key format")
        return v


class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    is_verified: bool
    tier: UserTier
    has_api_key: bool
    api_key_label: Optional[str]

    model_config = {"from_attributes": True}
