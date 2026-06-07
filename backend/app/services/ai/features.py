import json
from typing import Dict, Any
from app.services.ai.base import BaseAIProvider
from loguru import logger

SYSTEM_PROMPT = """You are an expert data scientist and feature engineer.
Analyze the dataset profile provided and suggest powerful feature engineering ideas.
Always respond with valid JSON only. No markdown, no explanation outside JSON."""


def build_feature_prompt(profile: Dict[str, Any], goal: str) -> str:
    columns = profile.get("column_info", [])
    numeric = [c["name"] for c in columns if c["is_numeric"]]
    categorical = [c["name"] for c in columns if c["is_categorical"]]
    missing = {c["name"]: c["missing_pct"] for c in columns if c["missing_pct"] > 0}

    return f"""
Dataset Overview:
- Rows: {profile.get("row_count")}
- Columns: {profile.get("column_count")}
- Numeric columns: {numeric}
- Categorical columns: {categorical}
- Columns with missing values: {missing}
- Duplicate rows: {profile.get("duplicate_count")}

Prediction Goal: {goal}

Respond ONLY with this JSON structure:
{{
  "feature_ideas": [
    {{
      "name": "feature_name",
      "description": "what this feature captures",
      "type": "interaction|transformation|aggregation|encoding|datetime|text",
      "source_columns": ["col1", "col2"],
      "code": "df['feature_name'] = ...",
      "expected_impact": "high|medium|low",
      "reasoning": "why this helps the prediction goal"
    }}
  ],
  "cleaning_suggestions": [
    {{
      "column": "col_name",
      "issue": "description of issue",
      "suggestion": "how to fix it",
      "code": "df['col'] = ..."
    }}
  ],
  "encoding_suggestions": [
    {{
      "column": "col_name",
      "current_type": "object",
      "recommended_encoding": "one-hot|label|target|ordinal",
      "reasoning": "why"
    }}
  ],
  "target_analysis": {{
    "recommended_target": "column_name or null",
    "task_type": "classification|regression|clustering",
    "reasoning": "why"
  }}
}}
"""


async def get_feature_suggestions(
    provider: BaseAIProvider,
    profile: Dict[str, Any],
    goal: str,
) -> Dict[str, Any]:
    prompt = build_feature_prompt(profile, goal)
    try:
        response = await provider.complete(SYSTEM_PROMPT, prompt, max_tokens=3000)
        clean = response.strip().replace("```json", "").replace("```", "")
        return json.loads(clean)
    except json.JSONDecodeError as e:
        logger.error(f"Feature suggestions JSON parse error: {e}")
        return {"error": "Failed to parse AI response", "raw": response}
    except Exception as e:
        logger.error(f"Feature suggestions error: {e}")
        raise
