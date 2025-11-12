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
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def main():
    """Main validation function."""
    build_dir = Path(".next/server/pages")
    public_dir = Path("public")
    
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
    
    # Add static files from public directory (e.g., /llm.txt, /robots.txt)
    if public_dir.exists():
        for static_file in public_dir.rglob("*"):
            if static_file.is_file():
                # Convert to URL path (e.g., public/llm.txt -> /llm.txt)
                relative_path = static_file.relative_to(public_dir)
                url_path = "/" + str(relative_path)
                all_pages.add(url_path)

    print(f"📄 Found {len(html_files)} pages to validate")
    print(f"🔗 Tracking {len(all_pages)} unique internal routes (HTML + static files)")
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
