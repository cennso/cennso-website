#!/usr/bin/env python3
"""
Structured Data Validation Script

Validates schema.org structured data (JSON-LD):
- JSON syntax validity
- Required properties present
- URL formats correct
- Date formats valid (ISO 8601)
- Schema types recognized
"""

import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


def validate_json_syntax(json_ld: str) -> Dict[str, Any]:
    """Validate JSON-LD syntax."""
    try:
        data = json.loads(json_ld)
        return {"valid": True, "data": data, "message": "Valid JSON"}
    except json.JSONDecodeError as e:
        return {"valid": False, "data": None, "message": f"JSON syntax error: {e}"}


def validate_schema_type(schema_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate @type is recognized schema.org type."""
    valid_types = [
        "Organization",
        "Article",
        "BlogPosting",
        "BreadcrumbList",
        "LocalBusiness",
        "JobPosting",
        "Service",
        "Person",
        "WebSite",
        "WebPage"
    ]
    
    schema_type = schema_data.get("@type", "")
    
    if not schema_type:
        return {"valid": False, "message": "@type is missing"}
    
    if schema_type not in valid_types:
        return {"valid": False, "message": f"Unknown @type: {schema_type}"}
    
    return {"valid": True, "type": schema_type, "message": "OK"}


def validate_url_format(url: str) -> bool:
    """Validate URL format."""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(url_pattern.match(url))


def validate_date_format(date_str: str) -> bool:
    """Validate ISO 8601 date format."""
    try:
        datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return True
    except (ValueError, AttributeError):
        return False


def validate_required_properties(schema_data: Dict[str, Any]) -> List[str]:
    """Validate required properties based on @type."""
    errors = []
    schema_type = schema_data.get("@type", "")
    
    # Common required properties
    if "@context" not in schema_data:
        errors.append("Missing @context")
    elif schema_data["@context"] != "https://schema.org":
        errors.append(f"Invalid @context: {schema_data['@context']}")
    
    # Type-specific required properties
    if schema_type == "Organization":
        if "name" not in schema_data:
            errors.append("Organization missing 'name'")
        if "url" not in schema_data:
            errors.append("Organization missing 'url'")
    
    elif schema_type in ["Article", "BlogPosting"]:
        required = ["headline", "author", "datePublished"]
        for prop in required:
            if prop not in schema_data:
                errors.append(f"{schema_type} missing '{prop}'")
        
        # Validate date format
        if "datePublished" in schema_data and not validate_date_format(schema_data["datePublished"]):
            errors.append(f"Invalid datePublished format: {schema_data['datePublished']}")
    
    elif schema_type == "BreadcrumbList":
        if "itemListElement" not in schema_data:
            errors.append("BreadcrumbList missing 'itemListElement'")
    
    elif schema_type == "JobPosting":
        required = ["title", "description", "datePosted", "hiringOrganization"]
        for prop in required:
            if prop not in schema_data:
                errors.append(f"JobPosting missing '{prop}'")
    
    return errors


def validate_structured_data(json_ld: str, context: str = "") -> Dict[str, Any]:
    """Validate structured data."""
    result = {"valid": True, "errors": [], "warnings": []}
    
    # Validate JSON syntax
    json_result = validate_json_syntax(json_ld)
    if not json_result["valid"]:
        result["valid"] = False
        result["errors"].append(json_result["message"])
        return result
    
    schema_data = json_result["data"]
    
    # Validate schema type
    type_result = validate_schema_type(schema_data)
    if not type_result["valid"]:
        result["valid"] = False
        result["errors"].append(type_result["message"])
        return result
    
    # Validate required properties
    property_errors = validate_required_properties(schema_data)
    if property_errors:
        result["valid"] = False
        result["errors"].extend(property_errors)
    
    # Validate URLs if present
    for key, value in schema_data.items():
        if key in ["url", "sameAs", "image"] and isinstance(value, str):
            if not validate_url_format(value):
                result["warnings"].append(f"Invalid URL format for '{key}': {value}")
    
    return result


def main():
    """Main validation function."""
    print("Structured Data Validation")
    print("=" * 50)
    print()
    
    # TODO: Implement actual page scanning
    # This is a skeleton - actual implementation will:
    # 1. Scan all built pages in .next/ or out/
    # 2. Extract <script type="application/ld+json"> blocks
    # 3. Validate each JSON-LD block
    # 4. Check required properties based on @type
    # 5. Validate URL and date formats
    # 6. Report violations with file paths
    
    print("⚠️  This is a skeleton script. Implementation pending.")
    print()
    print("To implement:")
    print("1. Parse built HTML files from .next/ or out/")
    print("2. Extract all <script type='application/ld+json'> blocks")
    print("3. Validate JSON syntax for each block")
    print("4. Check required properties based on @type")
    print("5. Validate URL formats (https://)")
    print("6. Validate date formats (ISO 8601)")
    print("7. Report violations with file paths and line numbers")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
