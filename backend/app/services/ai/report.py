import json
from typing import Dict, Any
from app.services.ai.base import BaseAIProvider
from loguru import logger

SYSTEM_PROMPT = """You are an expert data scientist writing a comprehensive dataset analysis report.
Generate a detailed, professional markdown report based on the dataset profile provided.
The report should be clear, insightful, and actionable.
Respond with ONLY the markdown content — no JSON wrapper, no code fences around the whole thing."""


def build_report_prompt(profile: Dict[str, Any], dataset_name: str) -> str:
    col_info  = profile.get("column_info", [])
    numeric   = [c["name"] for c in col_info if c.get("is_numeric")]
    cat_cols  = [c["name"] for c in col_info if c.get("is_categorical")]
    missing   = {c["name"]: c.get("missing_pct", 0) for c in col_info if c.get("missing_pct", 0) > 0}
    corr      = profile.get("correlation", {})
    top_corr  = corr.get("top_correlations", [])[:5] if corr else []

    numeric_summary = {}
    for c in col_info:
        if c.get("is_numeric") and c["name"] in profile.get("numeric_stats", {}):
            stats = profile["numeric_stats"][c["name"]]
            numeric_summary[c["name"]] = {
                "mean": round(stats.get("mean", 0) or 0, 4),
                "std":  round(stats.get("std", 0) or 0, 4),
                "min":  round(stats.get("min", 0) or 0, 4),
                "max":  round(stats.get("max", 0) or 0, 4),
            }

    return f"""Generate a comprehensive data analysis report for dataset: **{dataset_name}**

## Dataset Overview
- Total rows: {profile.get("row_count", 0):,}
- Total columns: {profile.get("column_count", 0)}
- Numeric columns ({len(numeric)}): {", ".join(numeric[:10])}
- Categorical columns ({len(cat_cols)}): {", ".join(cat_cols[:10])}
- Duplicate rows: {profile.get("duplicate_count", 0)}
- Memory usage: {profile.get("memory_usage_kb", 0):.1f} KB

## Missing Values
{json.dumps(missing, indent=2) if missing else "No missing values detected."}

## Numeric Statistics
{json.dumps(numeric_summary, indent=2) if numeric_summary else "No numeric columns."}

## Top Correlations
{json.dumps(top_corr, indent=2) if top_corr else "Not enough numeric columns for correlation."}

---

Write a professional markdown report with these sections:

# {dataset_name} — Data Analysis Report

## 1. Executive Summary
(3-4 sentences summarising what this dataset contains and its overall quality)

## 2. Dataset Overview
(Table or list of key statistics)

## 3. Data Quality Assessment
(Missing values analysis, duplicates, outliers, overall quality score with reasoning)

## 4. Column Analysis
(For each important column: type, distribution, notable statistics, issues)

## 5. Key Insights
(5-7 bullet points of the most important findings)

## 6. Correlations & Relationships
(Notable correlations, potential multicollinearity issues)

## 7. Data Cleaning Recommendations
(Prioritised list of cleaning steps with specific column names)

## 8. Feature Engineering Opportunities
(3-5 specific feature ideas based on the actual columns)

## 9. Recommended ML Approach
(Task type, top 3 model suggestions, key considerations)

## 10. Next Steps
(Concrete action items in order of priority)

Be specific — use the actual column names and statistics. Make it professional and immediately useful."""


async def generate_report(
    provider: BaseAIProvider,
    profile: Dict[str, Any],
    dataset_name: str,
) -> str:
    prompt = build_report_prompt(profile, dataset_name)
    try:
        report = await provider.complete(SYSTEM_PROMPT, prompt, max_tokens=4000)
        return report
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise
