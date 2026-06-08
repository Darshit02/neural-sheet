import json
import re
from typing import Any, Dict
from loguru import logger

def extract_json(text: str) -> Dict[str, Any]:
    """
    Extracts JSON from a string that might contain markdown or extra text.
    Finds the first '{' and the last '}' and attempts to parse the content between them.
    Also handles common AI mistakes like trailing commas.
    """
    if not text:
        raise ValueError("Empty response from AI")

    # Clean the text: remove markdown blocks if they exist
    clean_text = text.strip()
    code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", clean_text, re.DOTALL | re.IGNORECASE)
    if code_block_match:
        clean_text = code_block_match.group(1)

    # Find the JSON boundaries
    start_idx = clean_text.find('{')
    end_idx = clean_text.rfind('}')
    
    if start_idx == -1 or end_idx == -1:
        raise ValueError("No JSON object found in AI response")
        
    json_str = clean_text[start_idx : end_idx + 1]

    # Pre-process JSON string to handle common errors
    # 1. Remove trailing commas in objects and arrays
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    
    # 2. Handle potential multi-line strings that aren't properly escaped (risky but often needed)
    # This is a bit complex for regex, so we'll try parsing first
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # If it fails, try one more aggressive cleanup: remove control characters
        try:
            # Remove non-printable control characters except newline and tab
            json_str_cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', json_str)
            return json.loads(json_str_cleaned)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON even after cleanup. Text: {text[:200]}...")
            raise ValueError(f"Could not parse valid JSON: {str(e)}")
