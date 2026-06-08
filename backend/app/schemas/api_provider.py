from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.models.api_provider import ProviderName


PROVIDER_META = {
    ProviderName.ANTHROPIC: {
        "label": "Anthropic",
        "icon": "anthropic",
        "color": "#D97757",
        "models": ["claude-sonnet-4-5", "claude-haiku-4-5"],
        "docs_url": "https://console.anthropic.com/keys",
    },
    ProviderName.OPENAI: {
        "label": "OpenAI",
        "icon": "openai",
        "color": "#10A37F",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
        "docs_url": "https://platform.openai.com/api-keys",
    },
    ProviderName.GEMINI: {
        "label": "Google Gemini",
        "icon": "gemini",
        "color": "#4285F4",
        "models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
        "docs_url": "https://aistudio.google.com/app/apikey",
    },
    ProviderName.MISTRAL: {
        "label": "Mistral AI",
        "icon": "mistral",
        "color": "#FF7000",
        "models": ["mistral-large", "mistral-medium", "mistral-small"],
        "docs_url": "https://console.mistral.ai/api-keys",
    },
    ProviderName.COHERE: {
        "label": "Cohere",
        "icon": "cohere",
        "color": "#39594D",
        "models": ["command-r-plus", "command-r", "command"],
        "docs_url": "https://dashboard.cohere.com/api-keys",
    },
    ProviderName.GROQ: {
        "label": "Groq",
        "icon": "groq",
        "color": "#F55036",
        "models": ["llama-3.1-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
        "docs_url": "https://console.groq.com/keys",
    },
}


class AddProviderRequest(BaseModel):
    provider: ProviderName
    api_key: str
    label: Optional[str] = None
    is_default: Optional[bool] = False


class ProviderResponse(BaseModel):
    id: int
    provider: ProviderName
    label: Optional[str]
    is_active: bool
    is_default: bool
    masked_key: str
    meta: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderListItem(BaseModel):
    provider: ProviderName
    label: str
    icon: str
    color: str
    models: list
    docs_url: str
