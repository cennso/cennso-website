#!/usr/bin/env python3
"""
Validate OG images meet best practices.

WCAG Compliance: N/A (OG images are for social media previews, not page content)
EN 301 549: N/A

This script validates:
- Correct dimensions (1200×630px)
- File size limits (<300KB recommended, <500KB warning)
- All expected images are generated
- OG meta tags in HTML (og:image, og:image:width, og:image:height)
- Absolute URLs with domain
- Image files exist at specified paths
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Any

def validate_og_images():
    """Validate all generated OG images."""
    try:
        from PIL import Image
    except ImportError:
        print("❌ Error: Pillow (PIL) not installed")
        print("Install with: pip install Pillow")
        sys.exit(1)
    
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("❌ Error: BeautifulSoup4 not installed")
        print("Install with: pip install beautifulsoup4")
        sys.exit(1)

    # Check build output only (what gets deployed)
    build_public_path = Path(".next/standalone/public")
    og_images_path = build_public_path / "assets/og-images"
    pages_dir = Path(".next/server/pages")
    
    if not og_images_path.exists():
        print(f"❌ OG images directory not found: {og_images_path}")
        print("Run: yarn build")
        sys.exit(1)
    
    if not pages_dir.exists():
        print("❌ .next/server/pages directory not found")
        print("Run: yarn build")
        sys.exit(1)

    print("=" * 85)
    print("🔍 CENNSO WEBSITE - OG IMAGE VALIDATION")
    print("=" * 85)
    print()

    issues = []
    warnings = []
    images_found = 0
    total_size = 0

    # Expected dimensions for OG images
    EXPECTED_WIDTH = 1200
    EXPECTED_HEIGHT = 630
    MAX_SIZE_KB = 500  # Warning threshold
    RECOMMENDED_SIZE_KB = 300  # Best practice
    EXPECTED_DOMAIN = "https://www.cennso.com"

    for root, dirs, files in os.walk(og_images_path):
        for file in files:
            if file == "image.png":
                images_found += 1
                path = Path(root) / file
                # Calculate relative path from the OG images directory
                relative_path = path.relative_to(og_images_path)
                
                # Check dimensions
                with Image.open(path) as img:
                    width, height = img.size
                    if (width, height) != (EXPECTED_WIDTH, EXPECTED_HEIGHT):
                        issues.append(
                            f"{relative_path}: Wrong dimensions {width}×{height}px "
                            f"(expected {EXPECTED_WIDTH}×{EXPECTED_HEIGHT}px)"
                        )
                
                # Check file size
                size_bytes = path.stat().st_size
                size_kb = size_bytes / 1024
                total_size += size_kb
                
                if size_kb > MAX_SIZE_KB:
                    issues.append(
                        f"{relative_path}: File too large {size_kb:.1f}KB (max {MAX_SIZE_KB}KB)"
                    )
                elif size_kb > RECOMMENDED_SIZE_KB:
                    warnings.append(
                        f"{relative_path}: File larger than recommended {size_kb:.1f}KB "
                        f"(recommended <{RECOMMENDED_SIZE_KB}KB)"
                    )

    print(f"📊 IMAGE FILE VALIDATION:")
    print(f"   Images found: {images_found}")
    print(f"   Total size: {total_size:.1f}KB")
    print(f"   Average size: {total_size/images_found:.1f}KB per image" if images_found > 0 else "")
    print()

    # Validate OG meta tags in HTML
    print("🔍 Validating OG meta tags in HTML...")
    print()
    
    html_files = []
    for html_file in pages_dir.rglob('*.html'):
        # Skip internal Next.js pages
        if html_file.name.startswith('_'):
            continue
        # Skip error pages
        if html_file.name == '500.html':
            continue
        html_files.append(html_file)
    
    pages_validated = 0
    pages_with_og = 0
    
    for html_file in sorted(html_files):
        pages_validated += 1
        relative_path = html_file.relative_to(pages_dir)
        page_path = f"/{relative_path}".replace('.html', '').replace('/index', '') or '/'
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find og:image meta tag
            og_image_tag = soup.find('meta', property='og:image')
            og_width_tag = soup.find('meta', property='og:image:width')
            og_height_tag = soup.find('meta', property='og:image:height')
            og_title_tag = soup.find('meta', property='og:title')
            og_desc_tag = soup.find('meta', property='og:description')
            
            if not og_image_tag:
                issues.append(f"{page_path}: Missing og:image meta tag")
                continue
            
            pages_with_og += 1
            og_image_url = og_image_tag.get('content', '')
            
            # Validate og:image URL is absolute
            if not og_image_url.startswith(EXPECTED_DOMAIN):
                issues.append(
                    f"{page_path}: og:image must be absolute URL starting with {EXPECTED_DOMAIN}"
                )
            
            # Validate og:image:width
            if not og_width_tag:
                issues.append(f"{page_path}: Missing og:image:width meta tag")
            else:
                width_value = og_width_tag.get('content', '')
                if width_value != str(EXPECTED_WIDTH):
                    issues.append(
                        f"{page_path}: og:image:width is {width_value} (expected {EXPECTED_WIDTH})"
                    )
            
            # Validate og:image:height
            if not og_height_tag:
                issues.append(f"{page_path}: Missing og:image:height meta tag")
            else:
                height_value = og_height_tag.get('content', '')
                if height_value != str(EXPECTED_HEIGHT):
                    issues.append(
                        f"{page_path}: og:image:height is {height_value} (expected {EXPECTED_HEIGHT})"
                    )
            
            # Validate og:title exists
            if not og_title_tag:
                warnings.append(f"{page_path}: Missing og:title meta tag")
            
            # Validate og:description exists
            if not og_desc_tag:
                warnings.append(f"{page_path}: Missing og:description meta tag")
            
            # Validate image file exists (check against the actual build output path)
            if og_image_url.startswith(EXPECTED_DOMAIN):
                # Extract the path after domain (e.g., /assets/og-images/blog/post/image.png)
                url_path = og_image_url.replace(EXPECTED_DOMAIN, '')
                # Convert to filesystem path using build_public_path variable
                image_file = build_public_path / url_path.lstrip('/')
                if not image_file.exists():
                    issues.append(
                        f"{page_path}: OG image file not found: {image_file}"
                    )
        
        except Exception as e:
            issues.append(f"{page_path}: Error parsing HTML - {e}")
    
    print(f"📊 HTML META TAG VALIDATION:")
    print(f"   Pages scanned: {pages_validated}")
    print(f"   Pages with og:image: {pages_with_og}")
    print()

    # Print issues (failures)
    if issues:
        print("❌ ISSUES FOUND:")
        for issue in issues:
            print(f"   • {issue}")
        print()

    # Print warnings (best practice recommendations)
    if warnings:
        print("⚠️  WARNINGS:")
        for warning in warnings:
            print(f"   • {warning}")
        print()

    # Summary
    if not issues and not warnings:
        print("🎉 ✅ ALL OG IMAGE VALIDATION PASSED!")
        print()
        print("✅ Compliance:")
        print(f"   ✅ All images are {EXPECTED_WIDTH}×{EXPECTED_HEIGHT}px")
        print(f"   ✅ All images under {MAX_SIZE_KB}KB")
        print(f"   ✅ All images optimized (<{RECOMMENDED_SIZE_KB}KB)")
        print(f"   ✅ All pages have og:image meta tags")
        print(f"   ✅ All og:image URLs are absolute ({EXPECTED_DOMAIN})")
        print(f"   ✅ All og:image:width and og:image:height tags present")
        print(f"   ✅ All OG image files exist")
    elif not issues:
        print("✅ ALL REQUIRED CHECKS PASSED")
        print(f"⚠️  {len(warnings)} best practice warning(s)")
    else:
        print(f"❌ VALIDATION FAILED: {len(issues)} issue(s), {len(warnings)} warning(s)")

    print("=" * 85)
    print()

    # Exit with error if there are issues
    if issues:
        sys.exit(1)

if __name__ == "__main__":
    validate_og_images()
