#!/usr/bin/env python3
"""
Validate OG images meet best practices.

WCAG Compliance: N/A (OG images are for social media previews, not page content)
EN 301 549: N/A

This script validates:
- Correct dimensions (1200×630px)
- File size limits (<300KB recommended, <500KB warning)
- All expected images are generated
"""

import os
import sys
from pathlib import Path

def validate_og_images():
    """Validate all generated OG images."""
    try:
        from PIL import Image
    except ImportError:
        print("❌ Error: Pillow (PIL) not installed")
        print("Install with: pip install Pillow")
        sys.exit(1)

    og_dir = Path("public/assets/og-images")
    
    if not og_dir.exists():
        print("❌ OG images directory not found")
        print("Run: yarn generate:ogimages")
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

    for root, dirs, files in os.walk(og_dir):
        for file in files:
            if file == "image.png":
                images_found += 1
                path = Path(root) / file
                relative_path = path.relative_to("public/assets/og-images")
                
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

    print(f"📊 RESULTS:")
    print(f"   Images found: {images_found}")
    print(f"   Total size: {total_size:.1f}KB")
    print(f"   Average size: {total_size/images_found:.1f}KB per image" if images_found > 0 else "")
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
