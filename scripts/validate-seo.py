#!/usr/bin/env python3
"""
SEO Metadata Validation Script

Validates SEO metadata across all pages:
- Title tags (50-60 characters)
- Meta descriptions (150-160 characters)
- Canonical URLs present
- No duplicate titles/descriptions
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Set

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Run: pip install beautifulsoup4")
    sys.exit(1)

# ANSI color codes
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


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
    print("=" * 85)
    print(f"{BLUE}🔍 CENNSO WEBSITE - SEO METADATA VALIDATION{RESET}")
    print("=" * 85)
    print()
    
    # Find all HTML files in .next/server/pages
    pages_dir = Path('.next/server/pages')
    
    if not pages_dir.exists():
        print(f"{RED}❌ Error: .next/server/pages directory not found{RESET}")
        print(f"{YELLOW}   Run 'yarn build' first to generate static pages{RESET}")
        return 1
    
    # Find all HTML files
    html_files = []
    for html_file in pages_dir.rglob('*.html'):
        # Skip internal Next.js pages
        if html_file.name.startswith('_'):
            continue
        # Skip auto-generated error pages (500.html)
        if html_file.name == '500.html':
            continue
        html_files.append(html_file)
    
    if not html_files:
        print(f"{YELLOW}⚠️  No HTML files found in {pages_dir}{RESET}")
        return 1
    
    print(f"{BLUE}📄 Found {len(html_files)} pages to validate{RESET}")
    print()
    
    # Parse and validate each page
    all_titles: Set[str] = set()
    all_descriptions: Set[str] = set()
    duplicate_titles: List[tuple] = []
    duplicate_descriptions: List[tuple] = []
    pages_with_issues = []
    
    for html_file in sorted(html_files):
        relative_path = html_file.relative_to(pages_dir)
        page_path = f"/{relative_path}".replace('.html', '').replace('/index', '')
        if page_path == '/':
            page_path = '/ (homepage)'
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract title from <head> section only
            title = None
            if soup.head:
                title_tag = soup.head.find('title')
                if title_tag:
                    title = title_tag.string.strip() if title_tag.string else None
            
            # Extract description
            description = None
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag:
                description = desc_tag.get('content', '')
            
            # Extract canonical URL
            canonical = None
            canonical_tag = soup.find('link', attrs={'rel': 'canonical'})
            if canonical_tag:
                canonical = canonical_tag.get('href', '')
            
            errors = []
            warnings = []
            
            # Validate title
            if title:
                title_len = len(title)
                if title_len < 50 or title_len > 60:
                    warnings.append(f"Title length {title_len} chars (recommended 50-60)")
                
                # Check for duplicates
                if title in all_titles:
                    duplicate_titles.append((page_path, title))
                else:
                    all_titles.add(title)
            else:
                errors.append("Title tag missing")
            
            # Validate description
            if description:
                desc_len = len(description)
                if desc_len < 150 or desc_len > 160:
                    warnings.append(f"Description length {desc_len} chars (recommended 150-160)")
                
                # Check for duplicates
                if description in all_descriptions:
                    duplicate_descriptions.append((page_path, description))
                else:
                    all_descriptions.add(description)
            else:
                errors.append("Meta description missing")
            
            # Validate canonical URL
            if canonical:
                if not canonical.startswith('https://'):
                    errors.append(f"Canonical URL should use HTTPS: {canonical}")
            else:
                warnings.append("Canonical URL missing")
            
            # Report issues
            if errors or warnings:
                pages_with_issues.append({
                    'path': page_path,
                    'file': str(html_file),
                    'errors': errors,
                    'warnings': warnings,
                    'title': title,
                    'description': description,
                    'canonical': canonical
                })
        
        except Exception as e:
            print(f"{RED}❌ Error parsing {html_file}: {e}{RESET}")
    
    # Report results
    print("=" * 85)
    print(f"{BLUE}📊 VALIDATION RESULTS{RESET}")
    print("=" * 85)
    print()
    
    has_errors = False
    
    # Report pages with issues
    if pages_with_issues:
        for page in pages_with_issues:
            if page['errors']:
                has_errors = True
                print(f"{RED}❌ {page['path']}{RESET}")
                for error in page['errors']:
                    print(f"{RED}   ERROR: {error}{RESET}")
                for warning in page['warnings']:
                    print(f"{YELLOW}   WARNING: {warning}{RESET}")
                if page['title']:
                    print(f"   Title: \"{page['title']}\" ({len(page['title'])} chars)")
                if page['description']:
                    desc_preview = page['description'][:80] + '...' if len(page['description']) > 80 else page['description']
                    print(f"   Description: \"{desc_preview}\" ({len(page['description'])} chars)")
                print()
            elif page['warnings']:
                print(f"{YELLOW}⚠️  {page['path']}{RESET}")
                for warning in page['warnings']:
                    print(f"{YELLOW}   WARNING: {warning}{RESET}")
                if page['title']:
                    print(f"   Title: \"{page['title']}\" ({len(page['title'])} chars)")
                if page['description']:
                    desc_preview = page['description'][:80] + '...' if len(page['description']) > 80 else page['description']
                    print(f"   Description: \"{desc_preview}\" ({len(page['description'])} chars)")
                print()
    
    # Report duplicates
    if duplicate_titles:
        has_errors = True
        print(f"{RED}❌ DUPLICATE TITLES FOUND:{RESET}")
        title_groups: Dict[str, List[str]] = {}
        for page_path, title in duplicate_titles:
            if title not in title_groups:
                title_groups[title] = []
            title_groups[title].append(page_path)
        
        for title, pages in title_groups.items():
            print(f'{RED}   "{title}"{RESET}')
            for page in pages:
                print(f"{RED}      - {page}{RESET}")
        print()
    
    if duplicate_descriptions:
        has_errors = True
        print(f"{RED}❌ DUPLICATE DESCRIPTIONS FOUND:{RESET}")
        desc_groups: Dict[str, List[str]] = {}
        for page_path, desc in duplicate_descriptions:
            if desc not in desc_groups:
                desc_groups[desc] = []
            desc_groups[desc].append(page_path)
        
        for desc, pages in desc_groups.items():
            desc_preview = desc[:80] + '...' if len(desc) > 80 else desc
            print(f'{RED}   "{desc_preview}"{RESET}')
            for page in pages:
                print(f"{RED}      - {page}{RESET}")
        print()
    
    # Summary
    print("=" * 85)
    print(f"{BLUE}SUMMARY:{RESET}")
    print(f"   Pages scanned: {len(html_files)}")
    print(f"   Pages with errors: {len([p for p in pages_with_issues if p['errors']])}")
    print(f"   Pages with warnings: {len([p for p in pages_with_issues if p['warnings'] and not p['errors']])}")
    print(f"   Duplicate titles: {len(duplicate_titles)}")
    print(f"   Duplicate descriptions: {len(duplicate_descriptions)}")
    print()
    
    if not has_errors and not pages_with_issues:
        print(f"{GREEN}🎉 ✅ ALL SEO METADATA VALIDATION PASSED!{RESET}")
        print()
        print(f"{GREEN}✅ Compliance:{RESET}")
        print(f"{GREEN}   ✅ All pages have title tags{RESET}")
        print(f"{GREEN}   ✅ All pages have meta descriptions{RESET}")
        print(f"{GREEN}   ✅ All pages have canonical URLs{RESET}")
        print(f"{GREEN}   ✅ No duplicate titles or descriptions{RESET}")
        print(f"{GREEN}   ✅ Title lengths within recommended range{RESET}")
        print(f"{GREEN}   ✅ Description lengths within recommended range{RESET}")
    elif not has_errors:
        print(f"{YELLOW}⚠️  SEO METADATA VALIDATION PASSED WITH WARNINGS{RESET}")
        print()
        print(f"{YELLOW}Warnings are recommendations, not requirements{RESET}")
    else:
        print(f"{RED}❌ SEO METADATA VALIDATION FAILED{RESET}")
        print()
        print(f"{YELLOW}Fix errors above to ensure proper SEO{RESET}")
    
    print("=" * 85)
    
    return 1 if has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
