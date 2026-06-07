import anthropic
from typing import AsyncGenerator
from app.services.ai.base import BaseAIProvider
from loguru import logger


class AnthropicProvider(BaseAIProvider):

    async def complete(self, system: str, prompt: str, max_tokens: int = 2000) -> str:
        try:
            client = anthropic.Anthropic(api_key=self.api_key)
            message = client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"Anthropic error: {e}")
            raise

    async def stream(self, system: str, prompt: str, max_tokens: int = 2000) -> AsyncGenerator[str, None]:
        try:
            client = anthropic.Anthropic(api_key=self.api_key)
            with client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            logger.error(f"Anthropic stream error: {e}")
            raise

    async def validate_key(self) -> bool:
        try:
            client = anthropic.Anthropic(api_key=self.api_key)
            client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception:
            return False
