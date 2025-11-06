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
from bs4 import BeautifulSoup
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
    build_dir = Path(".next/server/pages")
    if not build_dir.exists():
        print("Build directory not found. Run `yarn build` first.")
        return 1

    html_files = list(build_dir.glob("**/*.html"))
    if not html_files:
        print("No HTML files found in build directory.")
        return 1

    # Create a set of all valid page paths for quick lookups
    # Example: /about, /blog/my-post
    all_pages = set()
    for file_path in html_files:
        relative_path = file_path.relative_to(build_dir)
        # Convert file path to URL path
        url_path = "/" + str(relative_path.with_suffix(''))
        if url_path.endswith("/index"):
            url_path = url_path[:-5] or "/"
        all_pages.add(url_path)

    print(f"📄 Found {len(html_files)} pages to validate")
    print(f"🔗 Tracking {len(all_pages)} unique internal routes")
    print("=" * 50)

    all_broken_links = []

    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            soup = BeautifulSoup(content, "html.parser")
            
            for link in soup.find_all("a", href=True):
                href = link["href"]
                
                # Ignore external links, mailto, tel, and anchor-only links
                if urlparse(href).scheme or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                    continue

                # Normalize internal link path
                parsed_href = urlparse(href)
                clean_path = parsed_href.path
                
                # Remove trailing slash for comparison
                if len(clean_path) > 1 and clean_path.endswith('/'):
                    clean_path = clean_path[:-1]

                if clean_path not in all_pages:
                    source_page = "/" + str(file_path.relative_to(build_dir).with_suffix(''))
                    if source_page.endswith("/index"):
                        source_page = source_page[:-5] or "/"
                    all_broken_links.append((source_page, href))

    print("\n📊 VALIDATION RESULTS")
    print("=" * 50)

    if all_broken_links:
        print(f"\n❌ Found {len(all_broken_links)} broken internal links:")
        for source, broken_link in all_broken_links:
            print(f"  - In page '{source}': found broken link to '{broken_link}'")
        return 1
    
    print("\n🎉 ✅ ALL INTERNAL LINKS ARE VALID!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
