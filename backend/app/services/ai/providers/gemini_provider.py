import httpx
from typing import AsyncGenerator
from app.services.ai.base import BaseAIProvider
from loguru import logger
import json


class GeminiProvider(BaseAIProvider):

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    async def complete(self, system: str, prompt: str, max_tokens: int = 2000) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.BASE_URL}/models/{self.model}:generateContent?key={self.api_key}",
                json={
                    "system_instruction": {"parts": [{"text": system}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens},
                },
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]

    async def stream(self, system: str, prompt: str, max_tokens: int = 2000) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/models/{self.model}:streamGenerateContent?key={self.api_key}&alt=sse",
                json={
                    "system_instruction": {"parts": [{"text": system}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens},
                },
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            text = data["candidates"][0]["content"]["parts"][0]["text"]
                            if text:
                                yield text
                        except Exception:
                            continue

    async def validate_key(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.BASE_URL}/models?key={self.api_key}"
                )
                return response.status_code == 200
        except Exception:
            return False
