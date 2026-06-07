import pandas as pd
import numpy as np
from typing import Dict, Any
from loguru import logger


def safe_value(val):
    """Convert numpy types to Python native for JSON serialization"""
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return None if np.isnan(val) else float(val)
    if isinstance(val, (np.bool_,)):
        return bool(val)
    if isinstance(val, (np.ndarray,)):
        return val.tolist()
    if pd.isna(val) if not isinstance(val, (list, dict)) else False:
        return None
    return val


def profile_dataset(file_path: str) -> Dict[str, Any]:
    logger.info(f"Profiling dataset: {file_path}")

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {e}")

    row_count, col_count = df.shape
    columns = df.columns.tolist()
    dtypes = {col: str(df[col].dtype) for col in columns}

    # Missing values
    missing = {col: int(df[col].isna().sum()) for col in columns}
    missing_pct = {col: round(missing[col] / row_count * 100, 2) for col in columns}

    # Sample data (first 5 rows)
    sample_data = df.head(5).replace({np.nan: None}).to_dict(orient="records")

    # Numeric stats
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    numeric_stats = {}
    if numeric_cols:
        desc = df[numeric_cols].describe()
        for col in numeric_cols:
            numeric_stats[col] = {
                k: safe_value(v)
                for k, v in desc[col].to_dict().items()
            }
            numeric_stats[col]["median"] = safe_value(df[col].median())
            numeric_stats[col]["skewness"] = safe_value(df[col].skew())
            numeric_stats[col]["kurtosis"] = safe_value(df[col].kurtosis())
            numeric_stats[col]["zeros"] = int((df[col] == 0).sum())
            numeric_stats[col]["negatives"] = int((df[col] < 0).sum())

    # Categorical stats
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    categorical_stats = {}
    for col in cat_cols:
        vc = df[col].value_counts().head(10)
        categorical_stats[col] = {
            "unique_count": int(df[col].nunique()),
            "top_values": {str(k): int(v) for k, v in vc.items()},
            "mode": str(df[col].mode()[0]) if not df[col].mode().empty else None,
        }

    # Correlation matrix (numeric only)
    correlation = {}
    if len(numeric_cols) > 1:
        corr_matrix = df[numeric_cols].corr()
        for col in numeric_cols:
            correlation[col] = {
                c: safe_value(corr_matrix[col][c])
                for c in numeric_cols
            }

    # Duplicate rows
    duplicate_count = int(df.duplicated().sum())

    # Column type summary
    column_info = []
    for col in columns:
        col_data = {
            "name": col,
            "dtype": dtypes[col],
            "missing_count": missing[col],
            "missing_pct": missing_pct[col],
            "unique_count": int(df[col].nunique()),
            "is_numeric": col in numeric_cols,
            "is_categorical": col in cat_cols,
        }
        if col in numeric_cols:
            col_data["min"] = safe_value(df[col].min())
            col_data["max"] = safe_value(df[col].max())
            col_data["mean"] = safe_value(df[col].mean())
        column_info.append(col_data)

    profile = {
        "row_count": row_count,
        "column_count": col_count,
        "columns": columns,
        "dtypes": dtypes,
        "missing_values": missing,
        "missing_pct": missing_pct,
        "sample_data": sample_data,
        "numeric_stats": numeric_stats,
        "categorical_stats": categorical_stats,
        "correlation": correlation,
        "duplicate_count": duplicate_count,
        "column_info": column_info,
        "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
        "has_header": True,
    }

    logger.info(f"Profiling complete: {row_count} rows x {col_count} cols")
    return profile
