#!/usr/bin/env python3
"""
WCAG 2.1 - Performance Best Practices: Image Optimization Validation

This script validates that all UI images follow optimization best practices:
- Images should be in WebP format for optimal compression
- Images should not exceed 100KB to ensure fast page loads
- Helps maintain Lighthouse performance scores ≥100

Usage:
    python3 scripts/check-image-optimization.py

Exit codes:
    0 - All images pass optimization checks
    1 - One or more images fail optimization checks
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

# Maximum allowed file size in bytes (100KB)
MAX_SIZE_BYTES = 100 * 1024  # 100KB

# Allowed image format
REQUIRED_FORMAT = '.webp'

# Directories to scan for images
IMAGE_DIRS = [
    'public/assets/about-page',
    'public/assets/avatars',
    'public/assets/backgrounds',
    'public/assets/blog-posts',
    'public/assets/common',
    'public/assets/ecosystem-partners',
    'public/assets/landing-page',
    'public/assets/success-stories',
    'public/assets/thumbnails',
]

# Image extensions to check
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'}

# Files to exclude from size check (but still check format)
SIZE_CHECK_EXCLUSIONS = set()

# SVG files are excluded from both format and size checks (vector format)
SVG_EXTENSION = '.svg'


def human_readable_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f}MB"


def check_images() -> Tuple[List[dict], List[dict]]:
    """
    Check all images in specified directories.
    
    Returns:
        Tuple of (format_issues, size_issues)
    """
    format_issues = []
    size_issues = []
    
    root_dir = Path(__file__).parent.parent
    
    for image_dir in IMAGE_DIRS:
        dir_path = root_dir / image_dir
        
        if not dir_path.exists():
            continue
            
        # Recursively find all image files
        for file_path in dir_path.rglob('*'):
            if not file_path.is_file():
                continue
                
            extension = file_path.suffix.lower()
            
            if extension not in IMAGE_EXTENSIONS:
                continue
            
            relative_path = file_path.relative_to(root_dir)
            file_size = file_path.stat().st_size
            
            # SVG files are vector format, skip all checks
            if extension == SVG_EXTENSION:
                continue
            
            # Check format (must be WebP for raster images)
            if extension != REQUIRED_FORMAT:
                format_issues.append({
                    'path': str(relative_path),
                    'extension': extension,
                    'size': file_size,
                })
            
            # Check size (must be under 100KB)
            if str(relative_path) not in SIZE_CHECK_EXCLUSIONS and file_size > MAX_SIZE_BYTES:
                size_issues.append({
                    'path': str(relative_path),
                    'size': file_size,
                    'extension': extension,
                })
    
    return format_issues, size_issues


def print_results(format_issues: List[dict], size_issues: List[dict]) -> None:
    """Print validation results in a formatted table."""
    print("\n" + "=" * 85)
    print("🖼️  CENNSO WEBSITE - IMAGE OPTIMIZATION VALIDATION")
    print("=" * 85)
    
    if format_issues:
        print("\n❌ FORMAT ISSUES - Images should be in WebP format:")
        print("-" * 85)
        print(f"{'File':<60} {'Format':<10} {'Size':<15}")
        print("-" * 85)
        
        for issue in sorted(format_issues, key=lambda x: x['path']):
            print(f"{issue['path']:<60} {issue['extension']:<10} {human_readable_size(issue['size']):<15}")
        
        print("-" * 85)
        print(f"Total format issues: {len(format_issues)}")
    
    if size_issues:
        print("\n❌ SIZE ISSUES - Images should be under 100KB:")
        print("-" * 85)
        print(f"{'File':<60} {'Size':<15} {'Overage':<15}")
        print("-" * 85)
        
        for issue in sorted(size_issues, key=lambda x: x['size'], reverse=True):
            overage = issue['size'] - MAX_SIZE_BYTES
            print(f"{issue['path']:<60} {human_readable_size(issue['size']):<15} "
                  f"+{human_readable_size(overage):<15}")
        
        print("-" * 85)
        print(f"Total size issues: {len(size_issues)}")
    
    if not format_issues and not size_issues:
        print("\n✅ ALL IMAGES OPTIMIZED!")
        print("-" * 85)
        print("• All raster images are in WebP format")
        print("• All images are under 100KB")
        print("• SVG vector images excluded from checks")
    
    print("\n" + "=" * 85)
    
    if format_issues or size_issues:
        print("\n📋 RECOMMENDATIONS:")
        print("-" * 85)
        print("🚀 QUICK FIX: Use the automatic optimization tool")
        print("\n  # Preview what will be optimized (dry run)")
        print("  yarn perf:images:optimize --dry-run")
        print("\n  # Optimize all images automatically (quality 80)")
        print("  yarn perf:images:optimize")
        print("\n  # Optimize with custom quality (1-100)")
        print("  yarn perf:images:optimize --quality 85")
        print("\n  # Create backups of original files")
        print("  yarn perf:images:optimize --backup")
        print("\n" + "-" * 85)
        print("• Manual tools (if needed):")
        print("  - cwebp (command line): cwebp -q 80 input.jpg -o output.webp")
        print("  - ImageMagick: convert input.jpg -quality 80 output.webp")
        print("  - Online tools: squoosh.app, cloudconvert.com")
        print("\n• Tips for best results:")
        print("  - Use lossy compression with quality 70-85")
        print("  - Resize images to actual display dimensions")
        print("  - Remove metadata/EXIF data")
        print("\n• Benefits:")
        print("  - Faster page loads (better user experience)")
        print("  - Improved Lighthouse performance scores")
        print("  - Lower bandwidth usage")
        print("  - Better mobile experience")
        print("=" * 85 + "\n")


def main() -> int:
    """Main execution function."""
    print("\n🔍 Scanning for image optimization issues...")
    
    format_issues, size_issues = check_images()
    
    print_results(format_issues, size_issues)
    
    # Return exit code
    if format_issues or size_issues:
        total_issues = len(format_issues) + len(size_issues)
        print(f"❌ FAILED: {total_issues} image optimization issue(s) found.\n")
        return 1
    else:
        print("✅ PASSED: All images are properly optimized.\n")
        return 0


if __name__ == '__main__':
    sys.exit(main())
