import json
from typing import Dict, Any
from app.services.ai.base import BaseAIProvider
from loguru import logger

SYSTEM_PROMPT = """You are an expert ML engineer specializing in hyperparameter optimization.
Provide detailed, practical hyperparameter tuning strategies.
Always respond with valid JSON only. No markdown, no explanation outside JSON."""


def build_hyperparam_prompt(profile: Dict[str, Any], model_type: str, task_type: str) -> str:
    return f"""
Dataset:
- Rows: {profile.get("row_count")}
- Features: {profile.get("column_count")}
- Numeric features: {len([c for c in profile.get("column_info", []) if c["is_numeric"]])}
- Categorical features: {len([c for c in profile.get("column_info", []) if c["is_categorical"]])}

Model: {model_type}
Task: {task_type}

Respond ONLY with this JSON structure:
{{
  "model_overview": {{
    "name": "{model_type}",
    "best_for": "description",
    "pros": ["pro1", "pro2"],
    "cons": ["con1", "con2"]
  }},
  "hyperparameters": [
    {{
      "name": "param_name",
      "description": "what it controls",
      "default_value": "value",
      "recommended_range": {{
        "min": "value",
        "max": "value",
        "step": "value or null"
      }},
      "recommended_value": "best starting value for this dataset",
      "impact": "high|medium|low",
      "tuning_strategy": "how to tune this param"
    }}
  ],
  "tuning_strategy": {{
    "recommended_method": "grid_search|random_search|bayesian|optuna",
    "reasoning": "why this method",
    "cv_folds": 5,
    "scoring_metric": "metric name",
    "estimated_time": "fast|medium|slow"
  }},
  "starter_code": {{
    "sklearn": "full sklearn code snippet",
    "optuna": "full optuna code snippet"
  }},
  "feature_scaling": {{
    "required": true,
    "recommended_scaler": "StandardScaler|MinMaxScaler|RobustScaler|None",
    "reasoning": "why"
  }},
  "alternative_models": [
    {{
      "name": "model_name",
      "reason": "why consider this instead"
    }}
  ]
}}
"""


async def get_hyperparameter_guide(
    provider: BaseAIProvider,
    profile: Dict[str, Any],
    model_type: str,
    task_type: str,
) -> Dict[str, Any]:
    prompt = build_hyperparam_prompt(profile, model_type, task_type)
    try:
        response = await provider.complete(SYSTEM_PROMPT, prompt, max_tokens=3000)
        clean = response.strip().replace("```json", "").replace("```", "")
        return json.loads(clean)
    except json.JSONDecodeError as e:
        logger.error(f"Hyperparams JSON parse error: {e}")
        return {"error": "Failed to parse AI response", "raw": response}
    except Exception as e:
        logger.error(f"Hyperparams error: {e}")
        raise
