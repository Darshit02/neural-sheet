import pandas as pd
import numpy as np
from typing import List, Dict, Any
from loguru import logger


def merge_datasets(
    left_path: str,
    right_path: str,
    left_on: List[str],
    right_on: List[str],
    how: str = "inner",
    suffixes: tuple = ("_left", "_right"),
):
    df_left  = pd.read_csv(left_path)
    df_right = pd.read_csv(right_path)

    merged = pd.merge(
        df_left, df_right,
        left_on=left_on,
        right_on=right_on,
        how=how,
        suffixes=suffixes,
    )

    def safe(v):
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, (np.floating,)):
            return None if np.isnan(v) else float(v)
        try:
            if pd.isna(v): return None
        except Exception:
            pass
        return v

    sample = merged.head(10).replace({np.nan: None}).to_dict(orient="records")
    sample = [{k: safe(vv) for k, vv in row.items()} for row in sample]

    stats = {
        "left_rows":   len(df_left),
        "right_rows":  len(df_right),
        "merged_rows": len(merged),
        "merged_cols": len(merged.columns),
        "left_cols":   len(df_left.columns),
        "right_cols":  len(df_right.columns),
        "matched_pct": round(len(merged) / max(len(df_left), 1) * 100, 1),
        "new_columns": merged.columns.tolist(),
    }

    return merged, sample, stats


def get_join_suggestions(left_cols: List[str], right_cols: List[str]) -> List[Dict]:
    suggestions = []
    left_set  = set(c.lower() for c in left_cols)
    right_set = set(c.lower() for c in right_cols)
    common    = left_set & right_set

    for c in common:
        left_match  = next(x for x in left_cols  if x.lower() == c)
        right_match = next(x for x in right_cols if x.lower() == c)
        suggestions.append({
            "left_on":  left_match,
            "right_on": right_match,
            "reason":   "Exact column name match",
        })

    id_patterns = ["id", "key", "code", "uuid", "identifier"]
    for lc in left_cols:
        for rc in right_cols:
            if lc.lower() != rc.lower():
                for pat in id_patterns:
                    if pat in lc.lower() and pat in rc.lower():
                        suggestions.append({
                            "left_on":  lc,
                            "right_on": rc,
                            "reason":   f"Both contain '{pat}'",
                        })

    return suggestions[:5]
