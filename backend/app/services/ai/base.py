from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional


class BaseAIProvider(ABC):
    """Base class for all AI providers"""

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def complete(self, system: str, prompt: str, max_tokens: int = 2000) -> str:
        pass

    @abstractmethod
    async def stream(self, system: str, prompt: str, max_tokens: int = 2000) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def validate_key(self) -> bool:
        pass
