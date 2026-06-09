import pandas as pd
import numpy as np
import re
from typing import Dict, Any, List
from loguru import logger


def apply_transformations(file_path: str, transformations: List[Dict[str, Any]]):
    df  = pd.read_csv(file_path)
    log = []

    for t in transformations:
        t_type = t.get("type")
        col    = t.get("column")

        try:
            if col and col not in df.columns:
                log.append(f"⚠ Column '{col}' not found — skipped")
                continue

            # ── Regex replace ────────────────────────────────────────
            if t_type == "regex_replace":
                pattern     = t.get("pattern", "")
                replacement = t.get("replacement", "")
                df[col]     = df[col].astype(str).str.replace(pattern, replacement, regex=True)
                log.append(f"Regex replaced '{pattern}' → '{replacement}' in '{col}'")

            # ── Value mapping ────────────────────────────────────────
            elif t_type == "map_values":
                mapping = t.get("mapping", {})
                df[col] = df[col].map(mapping).fillna(df[col])
                log.append(f"Mapped {len(mapping)} values in '{col}'")

            # ── Numeric binning ──────────────────────────────────────
            elif t_type == "bin_equal_width":
                bins      = int(t.get("bins", 5))
                new_col   = t.get("new_column", f"{col}_bin")
                labels    = t.get("labels")
                df[new_col] = pd.cut(df[col], bins=bins, labels=labels)
                log.append(f"Binned '{col}' into {bins} equal-width bins → '{new_col}'")

            elif t_type == "bin_equal_freq":
                bins      = int(t.get("bins", 5))
                new_col   = t.get("new_column", f"{col}_bin")
                labels    = t.get("labels")
                df[new_col] = pd.qcut(df[col], q=bins, labels=labels, duplicates="drop")
                log.append(f"Binned '{col}' into {bins} quantile bins → '{new_col}'")

            elif t_type == "bin_custom":
                edges   = t.get("edges", [])
                labels  = t.get("labels")
                new_col = t.get("new_column", f"{col}_bin")
                df[new_col] = pd.cut(df[col], bins=edges, labels=labels)
                log.append(f"Custom binned '{col}' → '{new_col}'")

            # ── String operations ────────────────────────────────────
            elif t_type == "extract_regex":
                pattern = t.get("pattern", "")
                group   = int(t.get("group", 0))
                new_col = t.get("new_column", f"{col}_extracted")
                df[new_col] = df[col].astype(str).str.extract(f"({pattern})")[0]
                log.append(f"Extracted regex group from '{col}' → '{new_col}'")

            elif t_type == "split_column":
                sep     = t.get("separator", ",")
                idx     = int(t.get("index", 0))
                new_col = t.get("new_column", f"{col}_part{idx}")
                df[new_col] = df[col].astype(str).str.split(sep).str[idx]
                log.append(f"Split '{col}' by '{sep}' → '{new_col}'")

            elif t_type == "concat_columns":
                cols      = t.get("columns", [])
                sep       = t.get("separator", " ")
                new_col   = t.get("new_column", "concatenated")
                df[new_col] = df[cols].astype(str).agg(sep.join, axis=1)
                log.append(f"Concatenated {cols} → '{new_col}'")

            # ── Math operations ──────────────────────────────────────
            elif t_type == "math_operation":
                expr    = t.get("expression", "")
                new_col = t.get("new_column", f"{col}_calc")
                local_env = {"df": df, "pd": pd, "np": np, "col": col}
                exec(f"df['{new_col}'] = {expr}", local_env)
                df = local_env["df"]
                log.append(f"Math op '{expr}' → '{new_col}'")

            # ── Datetime extraction ──────────────────────────────────
            elif t_type == "extract_datetime":
                parts = t.get("parts", ["year", "month", "day"])
                dt    = pd.to_datetime(df[col], errors="coerce")
                for part in parts:
                    new_col = f"{col}_{part}"
                    df[new_col] = getattr(dt.dt, part)
                    log.append(f"Extracted {part} from '{col}' → '{new_col}'")

            # ── Interaction features ─────────────────────────────────
            elif t_type == "multiply_columns":
                col2    = t.get("column2", "")
                new_col = t.get("new_column", f"{col}_x_{col2}")
                if col2 in df.columns:
                    df[new_col] = df[col] * df[col2]
                    log.append(f"Created interaction '{col}' × '{col2}' → '{new_col}'")

            elif t_type == "ratio_columns":
                col2    = t.get("column2", "")
                new_col = t.get("new_column", f"{col}_div_{col2}")
                if col2 in df.columns:
                    df[new_col] = df[col] / df[col2].replace(0, np.nan)
                    log.append(f"Created ratio '{col}' / '{col2}' → '{new_col}'")

        except Exception as e:
            logger.warning(f"Transform '{t_type}' on '{col}' failed: {e}")
            log.append(f"⚠ '{t_type}' on '{col}' failed: {e}")

    return df, log


def preview_transform(file_path: str, transformations: List[Dict[str, Any]], n: int = 10):
    import numpy as np
    df_clean, log = apply_transformations(file_path, transformations)

    def safe(v):
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, (np.floating,)):
            return None if np.isnan(v) else float(v)
        try:
            if pd.isna(v): return None
        except Exception:
            pass
        return v

    sample = df_clean.head(n).replace({np.nan: None}).to_dict(orient="records")
    sample = [{k: safe(vv) for k, vv in row.items()} for row in sample]

    return {
        "columns": df_clean.columns.tolist(),
        "preview_rows": sample,
        "new_columns": [c for c in df_clean.columns if c not in pd.read_csv(file_path).columns],
        "operations_log": log,
        "shape": [len(df_clean), len(df_clean.columns)],
    }
