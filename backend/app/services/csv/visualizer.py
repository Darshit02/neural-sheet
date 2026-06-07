import pandas as pd
import numpy as np
from typing import Dict, Any, List
from loguru import logger


def safe_val(val):
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return None if np.isnan(val) else float(val)
    if isinstance(val, (np.bool_,)):
        return bool(val)
    if isinstance(val, (np.ndarray,)):
        return val.tolist()
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    return val


def get_distribution_data(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Histogram data for numeric columns"""
    series = df[column].dropna()
    counts, bin_edges = np.histogram(series, bins=20)
    return {
        "type": "histogram",
        "column": column,
        "data": [
            {
                "bin_start": safe_val(bin_edges[i]),
                "bin_end": safe_val(bin_edges[i + 1]),
                "count": int(counts[i]),
                "label": f"{bin_edges[i]:.2f} - {bin_edges[i+1]:.2f}",
            }
            for i in range(len(counts))
        ],
        "stats": {
            "mean": safe_val(series.mean()),
            "median": safe_val(series.median()),
            "std": safe_val(series.std()),
            "min": safe_val(series.min()),
            "max": safe_val(series.max()),
        },
    }


def get_bar_data(df: pd.DataFrame, column: str, top_n: int = 15) -> Dict[str, Any]:
    """Bar chart data for categorical columns"""
    vc = df[column].value_counts().head(top_n)
    total = len(df[column].dropna())
    return {
        "type": "bar",
        "column": column,
        "data": [
            {
                "label": str(k),
                "count": int(v),
                "percentage": round(v / total * 100, 2),
            }
            for k, v in vc.items()
        ],
        "unique_count": int(df[column].nunique()),
        "total": total,
    }


def get_correlation_matrix(df: pd.DataFrame) -> Dict[str, Any]:
    """Correlation heatmap data"""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {"type": "correlation", "data": [], "columns": []}

    corr = numeric_df.corr()
    columns = corr.columns.tolist()
    data = []

    for i, row_col in enumerate(columns):
        for j, col_col in enumerate(columns):
            val = safe_val(corr[row_col][col_col])
            data.append({
                "x": col_col,
                "y": row_col,
                "value": val,
                "abs_value": abs(val) if val is not None else None,
            })

    # Top correlations
    top_correlations = []
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            val = safe_val(corr[columns[i]][columns[j]])
            if val is not None:
                top_correlations.append({
                    "col1": columns[i],
                    "col2": columns[j],
                    "correlation": val,
                    "strength": (
                        "strong" if abs(val) > 0.7
                        else "moderate" if abs(val) > 0.4
                        else "weak"
                    ),
                })

    top_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {
        "type": "correlation",
        "columns": columns,
        "data": data,
        "top_correlations": top_correlations[:10],
    }


def get_missing_values_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Missing values heatmap data"""
    missing = df.isnull().sum()
    total = len(df)

    data = []
    for col in df.columns:
        count = int(missing[col])
        pct = round(count / total * 100, 2)
        data.append({
            "column": col,
            "missing_count": count,
            "missing_pct": pct,
            "present_count": total - count,
            "present_pct": round(100 - pct, 2),
            "severity": (
                "high" if pct > 30
                else "medium" if pct > 10
                else "low" if pct > 0
                else "none"
            ),
        })

    data.sort(key=lambda x: x["missing_pct"], reverse=True)

    return {
        "type": "missing_values",
        "total_rows": total,
        "total_columns": len(df.columns),
        "columns_with_missing": sum(1 for d in data if d["missing_count"] > 0),
        "data": data,
    }


def get_scatter_data(
    df: pd.DataFrame, x_col: str, y_col: str, color_col: str = None
) -> Dict[str, Any]:
    """Scatter plot data"""
    subset = df[[x_col, y_col]].dropna()
    if color_col and color_col in df.columns:
        subset[color_col] = df[color_col]

    # Sample max 1000 points for performance
    if len(subset) > 1000:
        subset = subset.sample(1000, random_state=42)

    data = []
    for _, row in subset.iterrows():
        point = {
            "x": safe_val(row[x_col]),
            "y": safe_val(row[y_col]),
        }
        if color_col and color_col in subset.columns:
            point["color"] = str(row[color_col])
        data.append(point)

    return {
        "type": "scatter",
        "x_column": x_col,
        "y_column": y_col,
        "color_column": color_col,
        "data": data,
        "sample_size": len(data),
    }


def get_boxplot_data(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Boxplot data for outlier detection"""
    series = df[column].dropna()
    q1 = safe_val(series.quantile(0.25))
    q3 = safe_val(series.quantile(0.75))
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr

    outliers = series[(series < lower_fence) | (series > upper_fence)]

    return {
        "type": "boxplot",
        "column": column,
        "stats": {
            "min": safe_val(series.min()),
            "q1": q1,
            "median": safe_val(series.median()),
            "mean": safe_val(series.mean()),
            "q3": q3,
            "max": safe_val(series.max()),
            "iqr": safe_val(iqr),
            "lower_fence": safe_val(lower_fence),
            "upper_fence": safe_val(upper_fence),
        },
        "outliers": [safe_val(v) for v in outliers.tolist()[:100]],
        "outlier_count": len(outliers),
        "outlier_pct": round(len(outliers) / len(series) * 100, 2),
    }


def get_time_series_data(df: pd.DataFrame, date_col: str, value_col: str) -> Dict[str, Any]:
    """Time series line chart data"""
    try:
        df[date_col] = pd.to_datetime(df[date_col])
        df_sorted = df[[date_col, value_col]].dropna().sort_values(date_col)
        return {
            "type": "timeseries",
            "date_column": date_col,
            "value_column": value_col,
            "data": [
                {
                    "date": str(row[date_col]),
                    "value": safe_val(row[value_col]),
                }
                for _, row in df_sorted.iterrows()
            ],
        }
    except Exception as e:
        return {"type": "timeseries", "error": str(e), "data": []}


def get_overview_charts(file_path: str) -> Dict[str, Any]:
    """Generate all overview charts for a dataset"""
    df = pd.read_csv(file_path)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    result = {
        "missing_values": get_missing_values_data(df),
        "correlation": get_correlation_matrix(df) if len(numeric_cols) >= 2 else None,
        "distributions": {},
        "bar_charts": {},
        "boxplots": {},
    }

    # Distributions for numeric cols (max 10)
    for col in numeric_cols[:10]:
        try:
            result["distributions"][col] = get_distribution_data(df, col)
        except Exception as e:
            logger.warning(f"Distribution failed for {col}: {e}")

    # Bar charts for categorical cols (max 10)
    for col in cat_cols[:10]:
        try:
            result["bar_charts"][col] = get_bar_data(df, col)
        except Exception as e:
            logger.warning(f"Bar chart failed for {col}: {e}")

    # Boxplots for numeric cols (max 10)
    for col in numeric_cols[:10]:
        try:
            result["boxplots"][col] = get_boxplot_data(df, col)
        except Exception as e:
            logger.warning(f"Boxplot failed for {col}: {e}")

    return result
