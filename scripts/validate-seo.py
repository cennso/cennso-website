#!/usr/bin/env python3
"""
SEO Metadata Validation Script

Validates SEO metadata across all pages:
- Title tags (50-60 characters)
- Meta descriptions (150-160 characters)
- Canonical URLs present
- No duplicate titles/descriptions
"""

import sys
import json
from pathlib import Path
from typing import List, Dict, Any


def validate_title_length(title: str, min_len: int = 50, max_len: int = 60) -> Dict[str, Any]:
    """Validate title tag length."""
    length = len(title)
    is_valid = min_len <= length <= max_len
    
    return {
        "valid": is_valid,
        "length": length,
        "min": min_len,
        "max": max_len,
        "message": "OK" if is_valid else f"Title should be {min_len}-{max_len} chars, got {length}"
    }


def validate_description_length(description: str, min_len: int = 150, max_len: int = 160) -> Dict[str, Any]:
    """Validate meta description length."""
    length = len(description)
    is_valid = min_len <= length <= max_len
    
    return {
        "valid": is_valid,
        "length": length,
        "min": min_len,
        "max": max_len,
        "message": "OK" if is_valid else f"Description should be {min_len}-{max_len} chars, got {length}"
    }


def check_canonical_url(canonical: str) -> Dict[str, Any]:
    """Validate canonical URL format."""
    if not canonical:
        return {"valid": False, "message": "Canonical URL missing"}
    
    if not canonical.startswith("https://"):
        return {"valid": False, "message": "Canonical URL must use HTTPS"}
    
    return {"valid": True, "message": "OK"}


def validate_seo_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Validate SEO metadata for a single page."""
    errors = []
    warnings = []
    
    # Validate title
    if "title" in metadata:
        title_result = validate_title_length(metadata["title"])
        if not title_result["valid"]:
            errors.append(f"Title: {title_result['message']}")
    else:
        errors.append("Title is missing")
    
    # Validate description
    if "description" in metadata:
        desc_result = validate_description_length(metadata["description"])
        if not desc_result["valid"]:
            warnings.append(f"Description: {desc_result['message']}")
    else:
        errors.append("Description is missing")
    
    # Validate canonical URL
    if "canonical" in metadata:
        canonical_result = check_canonical_url(metadata["canonical"])
        if not canonical_result["valid"]:
            errors.append(f"Canonical: {canonical_result['message']}")
    else:
        warnings.append("Canonical URL is missing")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


def main():
    """Main validation function."""
    print("SEO Metadata Validation")
    print("=" * 50)
    print()
    
    # TODO: Implement actual page scanning
    # This is a skeleton - actual implementation will:
    # 1. Scan all built pages in .next/ or out/
    # 2. Extract meta tags from HTML
    # 3. Validate each page's SEO metadata
    # 4. Report duplicate titles/descriptions
    # 5. Check for missing canonical URLs
    
    print("⚠️  This is a skeleton script. Implementation pending.")
    print()
    print("To implement:")
    print("1. Parse built HTML files from .next/ or out/")
    print("2. Extract <title>, <meta name='description'>, <link rel='canonical'>")
    print("3. Validate lengths and formats")
    print("4. Check for duplicates across pages")
    print("5. Report violations with file paths")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
