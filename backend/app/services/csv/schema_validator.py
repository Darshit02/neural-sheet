import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any
from loguru import logger


def validate_schema(file_path: str, rules: List[Dict[str, Any]]) -> Dict[str, Any]:
    df      = pd.read_csv(file_path)
    results = []
    total_violations = 0

    for rule in rules:
        col       = rule.get("column")
        rule_type = rule.get("type")
        violations = []

        if col not in df.columns:
            results.append({
                "column": col, "rule": rule_type,
                "status": "error",
                "message": f"Column '{col}' not found in dataset",
                "violation_count": 0, "violation_pct": 0,
            })
            continue

        series = df[col]

        # ── Dtype check ───────────────────────────────────────────────
        if rule_type == "dtype":
            expected = rule.get("expected_dtype", "")
            actual   = str(series.dtype)
            ok = (
                (expected in ["int", "integer"] and pd.api.types.is_integer_dtype(series)) or
                (expected in ["float", "numeric"] and pd.api.types.is_float_dtype(series)) or
                (expected == "string" and pd.api.types.is_object_dtype(series)) or
                (expected == "bool" and pd.api.types.is_bool_dtype(series)) or
                (expected == "datetime" and pd.api.types.is_datetime64_any_dtype(series))
            )
            results.append({
                "column": col, "rule": f"dtype == {expected}",
                "status": "pass" if ok else "fail",
                "message": f"Expected {expected}, got {actual}",
                "violation_count": 0 if ok else len(series),
                "violation_pct":   0 if ok else 100,
            })

        # ── Not null ──────────────────────────────────────────────────
        elif rule_type == "not_null":
            null_count = int(series.isna().sum())
            pct        = round(null_count / len(df) * 100, 2)
            results.append({
                "column": col, "rule": "not_null",
                "status": "pass" if null_count == 0 else "fail",
                "message": f"{null_count:,} null values ({pct}%)",
                "violation_count": null_count, "violation_pct": pct,
                "sample_indices": series[series.isna()].index[:5].tolist(),
            })
            total_violations += null_count

        # ── Min value ─────────────────────────────────────────────────
        elif rule_type == "min_value":
            min_val   = rule.get("value")
            violating = series[series < min_val]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": f">= {min_val}",
                "status": "pass" if len(violating) == 0 else "fail",
                "message": f"{len(violating):,} values below {min_val}",
                "violation_count": len(violating), "violation_pct": pct,
                "sample_values": violating.head(5).tolist(),
            })
            total_violations += len(violating)

        # ── Max value ─────────────────────────────────────────────────
        elif rule_type == "max_value":
            max_val   = rule.get("value")
            violating = series[series > max_val]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": f"<= {max_val}",
                "status": "pass" if len(violating) == 0 else "fail",
                "message": f"{len(violating):,} values above {max_val}",
                "violation_count": len(violating), "violation_pct": pct,
                "sample_values": violating.head(5).tolist(),
            })
            total_violations += len(violating)

        # ── Unique ────────────────────────────────────────────────────
        elif rule_type == "unique":
            dup_count = int(series.duplicated().sum())
            pct       = round(dup_count / len(df) * 100, 2)
            results.append({
                "column": col, "rule": "unique",
                "status": "pass" if dup_count == 0 else "fail",
                "message": f"{dup_count:,} duplicate values ({pct}%)",
                "violation_count": dup_count, "violation_pct": pct,
            })
            total_violations += dup_count

        # ── Allowed values ────────────────────────────────────────────
        elif rule_type == "allowed_values":
            allowed   = set(rule.get("values", []))
            violating = series[~series.isin(allowed) & series.notna()]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": f"in {list(allowed)[:5]}{'...' if len(allowed) > 5 else ''}",
                "status": "pass" if len(violating) == 0 else "fail",
                "message": f"{len(violating):,} values not in allowed set",
                "violation_count": len(violating), "violation_pct": pct,
                "sample_values": violating.unique()[:5].tolist(),
            })
            total_violations += len(violating)

        # ── Regex pattern ─────────────────────────────────────────────
        elif rule_type == "regex":
            pattern   = rule.get("pattern", "")
            violating = series[~series.astype(str).str.match(pattern) & series.notna()]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": f"matches /{pattern}/",
                "status": "pass" if len(violating) == 0 else "fail",
                "message": f"{len(violating):,} values don't match pattern",
                "violation_count": len(violating), "violation_pct": pct,
                "sample_values": violating.head(5).tolist(),
            })
            total_violations += len(violating)

        # ── String length ─────────────────────────────────────────────
        elif rule_type == "string_length":
            min_len   = rule.get("min_length", 0)
            max_len   = rule.get("max_length", 99999)
            lengths   = series.astype(str).str.len()
            violating = series[(lengths < min_len) | (lengths > max_len)]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": f"length {min_len}–{max_len}",
                "status": "pass" if len(violating) == 0 else "fail",
                "message": f"{len(violating):,} values outside length range",
                "violation_count": len(violating), "violation_pct": pct,
            })
            total_violations += len(violating)

        # ── No outliers ───────────────────────────────────────────────
        elif rule_type == "no_outliers_iqr":
            q1, q3    = series.quantile(0.25), series.quantile(0.75)
            iqr       = q3 - q1
            violating = series[(series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)]
            pct       = round(len(violating) / len(df) * 100, 2)
            results.append({
                "column": col, "rule": "no_outliers (IQR)",
                "status": "pass" if len(violating) == 0 else "warn",
                "message": f"{len(violating):,} potential outliers ({pct}%)",
                "violation_count": len(violating), "violation_pct": pct,
            })

    pass_count = sum(1 for r in results if r["status"] == "pass")
    fail_count = sum(1 for r in results if r["status"] == "fail")
    warn_count = sum(1 for r in results if r["status"] == "warn")

    return {
        "total_rules":       len(results),
        "passed":            pass_count,
        "failed":            fail_count,
        "warnings":          warn_count,
        "total_violations":  total_violations,
        "overall_status":    "pass" if fail_count == 0 else "fail",
        "score":             round(pass_count / max(len(results), 1) * 100, 1),
        "results":           results,
    }
