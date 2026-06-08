import json
from typing import Dict, Any, List, AsyncGenerator
from app.services.ai.base import BaseAIProvider
from app.utils.helpers import extract_json
from loguru import logger


def build_chat_system(profile: Dict[str, Any]) -> str:
    columns = [c["name"] for c in profile.get("column_info", [])]
    numeric = [c["name"] for c in profile.get("column_info", []) if c["is_numeric"]]
    categorical = [c["name"] for c in profile.get("column_info", []) if c["is_categorical"]]

    return f"""You are NeuralSheet AI, an expert data engineer assistant.
You are analyzing a dataset with the following profile:

- Total rows: {profile.get("row_count")}
- Total columns: {profile.get("column_count")}
- All columns: {columns}
- Numeric columns: {numeric}
- Categorical columns: {categorical}
- Duplicate rows: {profile.get("duplicate_count")}
- Memory usage: {profile.get("memory_usage_kb")} KB

Answer questions about this dataset clearly and concisely.
When providing code, use Python with pandas. Be specific to the actual column names.
Format code in markdown code blocks."""


async def chat_with_dataset(
    provider: BaseAIProvider,
    profile: Dict[str, Any],
    messages: List[Dict[str, str]],
    stream: bool = False,
) -> str | AsyncGenerator[str, None]:
    system = build_chat_system(profile)

    # Build conversation
    conversation = []
    for msg in messages:
        conversation.append({
            "role": msg["role"],
            "content": msg["content"],
        })

    if stream:
        return provider.stream(system, conversation[-1]["content"], max_tokens=2000)
    else:
        return await provider.complete(system, conversation[-1]["content"], max_tokens=2000)


async def get_model_recommendation(
    provider: BaseAIProvider,
    profile: Dict[str, Any],
    goal: str,
) -> Dict[str, Any]:
    system = "You are an expert ML engineer. Respond with valid JSON only."
    prompt = f"""
Dataset: {profile.get("row_count")} rows, {profile.get("column_count")} columns
Goal: {goal}

Recommend the top 3 ML models for this task.
Respond ONLY with this JSON:
{{
  "recommendations": [
    {{
      "rank": 1,
      "model": "model name",
      "library": "sklearn|xgboost|lightgbm|pytorch|tensorflow",
      "task_type": "classification|regression|clustering",
      "reasoning": "why this model fits",
      "expected_performance": "high|medium|low",
      "training_time": "fast|medium|slow",
      "interpretability": "high|medium|low",
      "quick_start_code": "minimal working code"
    }}
  ],
  "data_size_assessment": "small|medium|large",
  "recommended_split": {{"train": 0.7, "val": 0.15, "test": 0.15}},
  "evaluation_metrics": ["metric1", "metric2"]
}}
"""
    try:
        response = await provider.complete(system, prompt, max_tokens=2000)
        return extract_json(response)
    except Exception as e:
        logger.error(f"Model recommendation error: {e}")
        return {"error": "Failed to parse AI response", "detail": str(e), "raw": locals().get('response', '')}
