from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token,
)
from app.core.config import settings
from typing import Dict, Any


def generate_tokens(user_id: int, email: str) -> Dict[str, Any]:
    data = {"sub": str(user_id), "email": email}
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data),
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
