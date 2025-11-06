#!/usr/bin/env python3
"""
Internal Links Validation Script

Validates internal linking structure:
- No broken internal links
- No redirect chains
- All links use absolute paths or proper relative paths
- Link anchor text is descriptive
"""

import sys
import re
from pathlib import Path
from typing import List, Dict, Any, Set
from urllib.parse import urlparse


def is_internal_link(href: str, base_domain: str = "cennso.io") -> bool:
    """Check if link is internal."""
    if not href:
        return False
    
    # Relative paths are internal
    if href.startswith('/'):
        return True
    
    # Check domain
    parsed = urlparse(href)
    return base_domain in parsed.netloc


def validate_link_format(href: str) -> Dict[str, Any]:
    """Validate link format."""
    errors = []
    warnings = []
    
    # Check for common issues
    if href.startswith('http://'):
        warnings.append("Using http:// instead of https://")
    
    if '#' in href and not href.startswith('#'):
        # Has fragment, could be anchor link
        pass
    
    if href.endswith('/') and '.' in href.split('/')[-2]:
        # Might be a file with trailing slash
        warnings.append("File path with trailing slash")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


def check_link_exists(href: str, pages: Set[str]) -> bool:
    """Check if internal link target exists."""
    # Remove fragment
    clean_href = href.split('#')[0]
    
    # Remove leading slash
    if clean_href.startswith('/'):
        clean_href = clean_href[1:]
    
    # Remove trailing slash
    if clean_href.endswith('/'):
        clean_href = clean_href[:-1]
    
    # Check if page exists
    return clean_href in pages or f"{clean_href}/index" in pages


def find_redirect_chains(links: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Find redirect chains in internal links."""
    # TODO: Implement redirect detection
    # This requires checking actual HTTP responses
    return []


def validate_internal_links(html_content: str, page_path: str, all_pages: Set[str]) -> Dict[str, Any]:
    """Validate internal links in HTML content."""
    result = {
        "valid": True,
        "broken_links": [],
        "warnings": [],
        "total_links": 0,
        "internal_links": 0
    }
    
    # Extract all links
    link_pattern = re.compile(r'<a\s+(?:[^>]*?\s+)?href="([^"]*)"', re.IGNORECASE)
    links = link_pattern.findall(html_content)
    
    result["total_links"] = len(links)
    
    for href in links:
        if is_internal_link(href):
            result["internal_links"] += 1
            
            # Validate format
            format_result = validate_link_format(href)
            if format_result["warnings"]:
                result["warnings"].extend([
                    f"{page_path}: {href} - {w}" 
                    for w in format_result["warnings"]
                ])
            
            # Check if target exists
            if not href.startswith('#'):  # Skip anchor-only links
                if not check_link_exists(href, all_pages):
                    result["broken_links"].append({
                        "page": page_path,
                        "href": href,
                        "message": "Target page not found"
                    })
                    result["valid"] = False
    
    return result


def main():
    """Main validation function."""
    print("Internal Links Validation")
    print("=" * 50)
    print()
    
    # TODO: Implement actual page scanning
    # This is a skeleton - actual implementation will:
    # 1. Scan all built pages in .next/ or out/
    # 2. Extract all <a href="..."> links
    # 3. Identify internal vs external links
    # 4. Check if internal link targets exist
    # 5. Detect redirect chains (301/302)
    # 6. Validate anchor text is descriptive
    # 7. Report broken links with file paths
    
    print("⚠️  This is a skeleton script. Implementation pending.")
    print()
    print("To implement:")
    print("1. Parse all built HTML files from .next/ or out/")
    print("2. Extract all <a href> links from each page")
    print("3. Classify links as internal vs external")
    print("4. Check if internal link targets exist (404 detection)")
    print("5. Detect redirect chains (requires HTTP requests)")
    print("6. Validate relative vs absolute path usage")
    print("7. Check anchor text for descriptiveness")
    print("8. Report broken links with source and target paths")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
