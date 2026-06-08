from app.db.models.api_provider import ProviderName
from app.services.ai.base import BaseAIProvider
from app.services.ai.providers import (
    AnthropicProvider, OpenAIProvider, GeminiProvider, GroqProvider
)

DEFAULT_MODELS = {
    ProviderName.ANTHROPIC: "claude-sonnet-4-5",
    ProviderName.OPENAI: "gpt-4o",
    ProviderName.GEMINI: "gemini-1.5-pro",
    ProviderName.MISTRAL: "mistral-large-latest",
    ProviderName.COHERE: "command-r-plus",
    ProviderName.GROQ: "llama-3.1-70b-versatile",
}


def get_ai_provider(
    provider_name: ProviderName,
    api_key: str,
    model: str = None,
) -> BaseAIProvider:
    model = model or DEFAULT_MODELS.get(provider_name)

    providers = {
        ProviderName.ANTHROPIC: AnthropicProvider,
        ProviderName.OPENAI: OpenAIProvider,
        ProviderName.GEMINI: GeminiProvider,
        ProviderName.GROQ: GroqProvider,
    }

    provider_class = providers.get(provider_name)
    if not provider_class:
        # Fallback to OpenAI if not specifically implemented but in DEFAULT_MODELS
        # or raise a more descriptive error
        if provider_name in [ProviderName.MISTRAL, ProviderName.COHERE]:
             raise ValueError(f"Provider {provider_name} is not yet fully implemented in this version.")
        raise ValueError(f"Provider {provider_name} not yet implemented")

    return provider_class(api_key=api_key, model=model)
