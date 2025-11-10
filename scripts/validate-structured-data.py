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
from bs4 import BeautifulSoup


def validate_json_syntax(json_ld: str) -> Dict[str, Any]:
    """Validate JSON-LD syntax."""
    try:
        data = json.loads(json_ld)
        return {"valid": True, "data": data, "message": "Valid JSON"}
    except json.JSONDecodeError as e:
        return {"valid": False, "data": None, "message": f"JSON syntax error: {e}"}


def validate_schema_type(schema_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate @type is recognized schema.org type.
    
    Handles @type as:
    - String: single type
    - List: multiple types (all must be valid)
    - Missing: returns error
    - Other: returns invalid type error
    
    Returns normalized @type as list in successful response.
    """
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
        "WebPage",
        "FAQPage",
        "Question",
        "Answer",
        "PostalAddress",
        "GeoCoordinates",
        "ImageObject",
        "ContactPoint"
    ]
    
    schema_type_raw = schema_data.get("@type")
    
    # Check if @type is missing
    if schema_type_raw is None:
        return {"valid": False, "message": "@type is missing"}
    
    # Normalize @type to list
    if isinstance(schema_type_raw, str):
        # Single string type
        schema_types = [schema_type_raw]
    elif isinstance(schema_type_raw, list):
        # Already a list
        schema_types = schema_type_raw
    else:
        # Invalid type (not string or list)
        return {"valid": False, "message": f"@type must be string or array, got {type(schema_type_raw).__name__}"}
    
    # Validate each type in the list
    unrecognized_types = [t for t in schema_types if t not in valid_types]
    
    if unrecognized_types:
        return {
            "valid": False,
            "message": f"Unrecognized @type values: {', '.join(unrecognized_types)}. Valid types: {', '.join(valid_types)}"
        }
    
    # All types are valid
    return {"valid": True, "types": schema_types, "message": "OK"}


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
    
    elif schema_type == "FAQPage":
        if "mainEntity" not in schema_data:
            errors.append("FAQPage missing 'mainEntity'")
        elif isinstance(schema_data["mainEntity"], list):
            if len(schema_data["mainEntity"]) < 2:
                errors.append("FAQPage must have at least 2 questions")
            # Validate each Question
            for i, question in enumerate(schema_data["mainEntity"]):
                if not isinstance(question, dict):
                    errors.append(f"FAQPage mainEntity[{i}] is not an object")
                    continue
                if question.get("@type") != "Question":
                    errors.append(f"FAQPage mainEntity[{i}] must have @type: Question")
                if "name" not in question:
                    errors.append(f"FAQPage Question[{i}] missing 'name'")
                if "acceptedAnswer" not in question:
                    errors.append(f"FAQPage Question[{i}] missing 'acceptedAnswer'")
                elif isinstance(question["acceptedAnswer"], dict):
                    answer = question["acceptedAnswer"]
                    if answer.get("@type") != "Answer":
                        errors.append(f"FAQPage Question[{i}] acceptedAnswer must have @type: Answer")
                    if "text" not in answer:
                        errors.append(f"FAQPage Question[{i}] Answer missing 'text'")
    
    elif schema_type == "LocalBusiness":
        required = ["name", "address", "telephone"]
        for prop in required:
            if prop not in schema_data:
                errors.append(f"LocalBusiness missing '{prop}'")
        # Validate address structure
        if "address" in schema_data:
            address = schema_data["address"]
            if isinstance(address, dict):
                if address.get("@type") != "PostalAddress":
                    errors.append("LocalBusiness address must have @type: PostalAddress")
                addr_required = ["streetAddress", "addressLocality", "postalCode", "addressCountry"]
                for prop in addr_required:
                    if prop not in address:
                        errors.append(f"LocalBusiness PostalAddress missing '{prop}'")
    
    elif schema_type == "Person":
        if "name" not in schema_data:
            errors.append("Person missing 'name'")
        if "url" not in schema_data:
            errors.append("Person missing 'url'")
    
    elif schema_type == "JobPosting":
        required = ["title", "description", "datePosted", "hiringOrganization"]
        for prop in required:
            if prop not in schema_data:
                errors.append(f"JobPosting missing '{prop}'")
    
    return errors


def validate_structured_data(json_ld_string, file_path):
    """Validate a single JSON-LD block."""
    errors = []
    warnings = []
    is_valid = True

    # JSON syntax validation
    syntax_check = validate_json_syntax(json_ld_string)
    if not syntax_check["valid"]:
        errors.append(syntax_check["message"])
        return {"valid": False, "errors": errors, "warnings": warnings}
    
    data = syntax_check["data"]

    # Schema type validation
    type_check = validate_schema_type(data)
    if not type_check["valid"]:
        errors.append(type_check["message"])
        is_valid = False
    
    # Required properties validation
    prop_errors = validate_required_properties(data)
    if prop_errors:
        errors.extend(prop_errors)
        is_valid = False

    # URL format validation
    if "url" in data and isinstance(data["url"], str):
        if not validate_url_format(data["url"]):
            errors.append(f"Invalid URL format: {data['url']}")
            is_valid = False
        elif not data["url"].startswith("https://"):
            warnings.append(f"URL should use https:// (got {data['url']})")

    return {"valid": is_valid, "errors": errors, "warnings": warnings}


def main():
    """Main validation function."""
    build_dir = Path(".next/server/pages")
    if not build_dir.exists():
        print("❌ Build directory not found. Run `yarn build` first.")
        return 1

    html_files = list(build_dir.glob("**/*.html"))
    if not html_files:
        print("❌ No HTML files found in build directory.")
        return 1

    print(f"📄 Found {len(html_files)} pages to validate")
    print("=" * 50)

    all_errors = []
    all_warnings = []
    pages_with_schemas = 0
    total_schemas = 0

    for file_path in html_files:
        # Skip 500.html - auto-generated error page not under our control
        if file_path.name == "500.html":
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            soup = BeautifulSoup(content, "html.parser")
            json_ld_scripts = soup.find_all("script", {"type": "application/ld+json"})

            if not json_ld_scripts:
                # It's a warning because not all pages require structured data (e.g., 404)
                all_warnings.append(f"{file_path.relative_to(build_dir)}: No JSON-LD script found")
                continue

            pages_with_schemas += 1
            for i, script in enumerate(json_ld_scripts):
                total_schemas += 1
                if not script.string:
                    all_warnings.append(f"{file_path.relative_to(build_dir)} (Script {i+1}): Is empty")
                    continue
                
                result = validate_structured_data(script.string, str(file_path))
                if not result["valid"]:
                    for error in result["errors"]:
                        all_errors.append(f"{file_path.relative_to(build_dir)} (Script {i+1}): {error}")
                if result["warnings"]:
                    for warning in result["warnings"]:
                        all_warnings.append(f"{file_path.relative_to(build_dir)} (Script {i+1}): {warning}")

    print("\n📊 VALIDATION RESULTS")
    print("=" * 50)
    print(f"Pages with schemas: {pages_with_schemas}/{len(html_files) - 1}")  # -1 for 500.html
    print(f"Total schemas validated: {total_schemas}")

    if all_warnings:
        print(f"\n⚠️  Warnings ({len(all_warnings)}):")
        for warning in all_warnings:
            print(f"  - {warning}")

    if all_errors:
        print(f"\n❌ Errors ({len(all_errors)}):")
        for error in all_errors:
            print(f"  - {error}")
        print(f"\nFound {len(all_errors)} errors in structured data.")
        print("\n💡 Tip: Test manually at https://search.google.com/test/rich-results")
        return 1

    print("\n🎉 ✅ ALL STRUCTURED DATA VALIDATION PASSED!")
    print("\n💡 Next steps:")
    print("  1. Test manually: https://search.google.com/test/rich-results")
    print("  2. Submit sitemap to Google Search Console")
    print("  3. Monitor 'Enhancements' tab for rich result status")
    return 0


if __name__ == "__main__":
    sys.exit(main())
