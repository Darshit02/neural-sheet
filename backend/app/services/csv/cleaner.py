import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from loguru import logger


def apply_cleaning_ops(file_path: str, operations: List[Dict[str, Any]]) -> pd.DataFrame:
    """Apply a list of cleaning operations to a dataframe."""
    df = pd.read_csv(file_path)
    log = []

    for op in operations:
        op_type = op.get("type")
        col     = op.get("column")

        try:
            # ── Missing value strategies ──────────────────────────────
            if op_type == "fill_mean" and col in df.columns:
                val = df[col].mean()
                df[col] = df[col].fillna(val)
                log.append(f"Filled missing in '{col}' with mean ({val:.4f})")

            elif op_type == "fill_median" and col in df.columns:
                val = df[col].median()
                df[col] = df[col].fillna(val)
                log.append(f"Filled missing in '{col}' with median ({val:.4f})")

            elif op_type == "fill_mode" and col in df.columns:
                val = df[col].mode()[0] if not df[col].mode().empty else None
                if val is not None:
                    df[col] = df[col].fillna(val)
                log.append(f"Filled missing in '{col}' with mode ({val})")

            elif op_type == "fill_value" and col in df.columns:
                val = op.get("value", 0)
                df[col] = df[col].fillna(val)
                log.append(f"Filled missing in '{col}' with constant ({val})")

            elif op_type == "fill_ffill" and col in df.columns:
                df[col] = df[col].ffill()
                log.append(f"Forward-filled missing in '{col}'")

            elif op_type == "fill_bfill" and col in df.columns:
                df[col] = df[col].bfill()
                log.append(f"Backward-filled missing in '{col}'")

            elif op_type == "drop_rows_missing" and col in df.columns:
                before = len(df)
                df = df.dropna(subset=[col])
                log.append(f"Dropped {before - len(df)} rows with missing '{col}'")

            elif op_type == "drop_column" and col in df.columns:
                df = df.drop(columns=[col])
                log.append(f"Dropped column '{col}'")

            # ── Duplicates ────────────────────────────────────────────
            elif op_type == "drop_duplicates":
                before = len(df)
                subset = op.get("subset")
                df = df.drop_duplicates(subset=subset)
                log.append(f"Dropped {before - len(df)} duplicate rows")

            # ── Outliers ──────────────────────────────────────────────
            elif op_type == "cap_outliers_iqr" and col in df.columns:
                q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
                iqr = q3 - q1
                lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
                before_out = ((df[col] < lower) | (df[col] > upper)).sum()
                df[col] = df[col].clip(lower=lower, upper=upper)
                log.append(f"Capped {before_out} outliers in '{col}' (IQR)")

            elif op_type == "drop_outliers_iqr" and col in df.columns:
                q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
                iqr = q3 - q1
                lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
                before = len(df)
                df = df[(df[col] >= lower) & (df[col] <= upper)]
                log.append(f"Dropped {before - len(df)} outlier rows in '{col}'")

            elif op_type == "cap_outliers_zscore" and col in df.columns:
                mean, std = df[col].mean(), df[col].std()
                z = op.get("z", 3)
                lower, upper = mean - z * std, mean + z * std
                before_out = ((df[col] < lower) | (df[col] > upper)).sum()
                df[col] = df[col].clip(lower=lower, upper=upper)
                log.append(f"Capped {before_out} outliers in '{col}' (Z-score ±{z})")

            # ── Type conversions ──────────────────────────────────────
            elif op_type == "cast_int" and col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
                log.append(f"Cast '{col}' to integer")

            elif op_type == "cast_float" and col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                log.append(f"Cast '{col}' to float")

            elif op_type == "cast_string" and col in df.columns:
                df[col] = df[col].astype(str)
                log.append(f"Cast '{col}' to string")

            elif op_type == "cast_datetime" and col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce")
                log.append(f"Cast '{col}' to datetime")

            # ── String cleaning ───────────────────────────────────────
            elif op_type == "strip_whitespace" and col in df.columns:
                df[col] = df[col].astype(str).str.strip()
                log.append(f"Stripped whitespace in '{col}'")

            elif op_type == "lowercase" and col in df.columns:
                df[col] = df[col].astype(str).str.lower()
                log.append(f"Lowercased '{col}'")

            elif op_type == "uppercase" and col in df.columns:
                df[col] = df[col].astype(str).str.upper()
                log.append(f"Uppercased '{col}'")

            # ── Encoding ──────────────────────────────────────────────
            elif op_type == "label_encode" and col in df.columns:
                df[col], _ = pd.factorize(df[col])
                log.append(f"Label-encoded '{col}'")

            elif op_type == "onehot_encode" and col in df.columns:
                dummies = pd.get_dummies(df[col], prefix=col, drop_first=False)
                df = pd.concat([df.drop(columns=[col]), dummies], axis=1)
                log.append(f"One-hot encoded '{col}' → {list(dummies.columns)}")

            # ── Scaling ───────────────────────────────────────────────
            elif op_type == "normalize_minmax" and col in df.columns:
                mn, mx = df[col].min(), df[col].max()
                if mx != mn:
                    df[col] = (df[col] - mn) / (mx - mn)
                log.append(f"Min-max normalised '{col}' → [0, 1]")

            elif op_type == "standardize_zscore" and col in df.columns:
                mean, std = df[col].mean(), df[col].std()
                if std != 0:
                    df[col] = (df[col] - mean) / std
                log.append(f"Z-score standardised '{col}'")

            # ── Feature engineering ───────────────────────────────────
            elif op_type == "add_feature":
                name = op.get("name", "new_feature")
                code = op.get("code", "")
                if code:
                    local_env = {"df": df, "pd": pd, "np": np}
                    exec(code, local_env)
                    df = local_env["df"]
                    log.append(f"Added feature '{name}'")

            elif op_type == "rename_column" and col in df.columns:
                new_name = op.get("new_name")
                if new_name:
                    df = df.rename(columns={col: new_name})
                    log.append(f"Renamed '{col}' → '{new_name}'")

        except Exception as e:
            logger.warning(f"Op '{op_type}' on '{col}' failed: {e}")
            log.append(f"⚠ Op '{op_type}' failed: {e}")

    return df, log


def get_cleaning_suggestions(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Auto-generate cleaning suggestions from a profile."""
    suggestions = []
    columns = profile.get("column_info", [])
    row_count = profile.get("row_count", 1)

    for col in columns:
        name = col["name"]
        missing_pct = col.get("missing_pct", 0)
        is_numeric = col.get("is_numeric", False)
        dtype = col.get("dtype", "")

        # Missing values
        if 0 < missing_pct <= 5:
            suggestions.append({
                "column": name, "issue": f"{missing_pct:.1f}% missing",
                "severity": "low",
                "op": "fill_median" if is_numeric else "fill_mode",
                "label": f"Fill with {'median' if is_numeric else 'mode'}",
            })
        elif 5 < missing_pct <= 30:
            suggestions.append({
                "column": name, "issue": f"{missing_pct:.1f}% missing",
                "severity": "medium",
                "op": "fill_median" if is_numeric else "fill_mode",
                "label": f"Fill with {'median' if is_numeric else 'mode'}",
            })
        elif missing_pct > 30:
            suggestions.append({
                "column": name, "issue": f"{missing_pct:.1f}% missing — consider dropping",
                "severity": "high",
                "op": "drop_column",
                "label": "Drop column",
            })

    # Duplicates
    dup_count = profile.get("duplicate_count", 0)
    if dup_count > 0:
        dup_pct = round(dup_count / row_count * 100, 1)
        suggestions.append({
            "column": None, "issue": f"{dup_count:,} duplicate rows ({dup_pct}%)",
            "severity": "medium" if dup_pct > 5 else "low",
            "op": "drop_duplicates",
            "label": "Remove duplicates",
        })

    return suggestions
