#!/usr/bin/env python3
"""
Image Optimization Tool - Convert and compress images to WebP format

This script automatically optimizes images by:
- Converting JPG, JPEG, PNG, GIF, BMP to WebP format
- Compressing images to reduce file size
- Maintaining image quality (configurable)
- Preser    print("-" * 115)
    
    # Summary
    total_saved = total_original_size - total_new_size
    total_saved_pct = (total_saved / total_original_size * 100) if total_original_size > 0 else 0
    
    print(f"\n{'TOTAL:':<43} {'':<22} "
          f"{human_readable_size(total_original_size):<12} "
          f"{human_readable_size(total_new_size):<12} "
          f"-{human_readable_size(total_saved):<11} ({total_saved_pct:.0f}%)")tory structure
- Creating backups of original files

Usage:
    python3 scripts/optimize-images.py [--quality QUALITY] [--backup] [--dry-run]

Options:
    --quality QUALITY   WebP quality (1-100, default: 80)
    --backup           Create .bak backup of original files
    --dry-run          Show what would be done without making changes

Requirements:
    pip install Pillow

Exit codes:
    0 - Success
    1 - Error occurred
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from typing import List, Tuple

try:
    from PIL import Image
except ImportError:
    print("\n❌ ERROR: Pillow library not found.")
    print("\nPlease install it using:")
    print("  pip3 install Pillow")
    print("\nOr using your package manager:")
    print("  brew install pillow  # macOS")
    print("  apt install python3-pil  # Ubuntu/Debian")
    sys.exit(1)

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

# Image extensions to convert
CONVERTIBLE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}

# SVG files are vector format, skip
SVG_EXTENSION = '.svg'


def human_readable_size(size_bytes: int) -> str:
    """Convert bytes to human-readable format."""
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f}MB"


def optimize_image(
    input_path: Path,
    quality: int = 80,
    backup: bool = False,
    dry_run: bool = False
) -> Tuple[bool, str, int, int]:
    """
    Optimize an image by converting to WebP.
    
    Args:
        input_path: Path to the input image
        quality: WebP quality (1-100)
        backup: Whether to create a backup
        dry_run: Whether to simulate without making changes
    
    Returns:
        Tuple of (success, message, original_size, new_size)
    """
    try:
        # Get original size
        original_size = input_path.stat().st_size
        
        # Determine output path
        output_path = input_path.with_suffix('.webp')
        
        # If already WebP, just compress it
        if input_path.suffix.lower() == '.webp':
            output_path = input_path
        
        if dry_run:
            # Estimate size reduction based on file type and quality
            # Compression ratios represent: new_size = original_size * ratio
            MAX_SIZE = 100 * 1024  # 100KB in bytes
            
            if input_path.suffix.lower() == '.webp':
                # Already WebP, recompression can achieve ~10-15% additional savings
                compression_ratio = 0.85  # Keep 85% of size (15% savings)
            elif input_path.suffix.lower() in {'.jpg', '.jpeg'}:
                # JPEG to WebP typically achieves 25-35% smaller files at equivalent quality
                # Quality 80 gives ~30% size reduction
                compression_ratio = 0.65 + (quality - 80) * 0.005  # Adjust based on quality
            elif input_path.suffix.lower() == '.png':
                # PNG to WebP is highly variable:
                # - Photos/complex images: 40-60% smaller (ratio 0.40-0.60)
                # - Simple graphics/logos: 20-40% smaller (ratio 0.60-0.80)
                # Using conservative estimate of 50% of original size
                compression_ratio = 0.50  # Keep 50% of size (50% savings)
            else:
                # GIF, BMP, etc. - typically compress well to WebP
                compression_ratio = 0.45  # Keep 45% of size (55% savings)
            
            estimated_size = int(original_size * compression_ratio)
            
            # If still over 100KB, cap it at 100KB (iterative quality reduction will happen)
            if estimated_size > MAX_SIZE:
                estimated_size = MAX_SIZE
            
            action = "compress" if input_path == output_path else f"convert to {output_path.name}"
            return True, action, original_size, estimated_size
        
        # Create backup if requested
        if backup and input_path != output_path:
            backup_path = input_path.with_suffix(input_path.suffix + '.bak')
            shutil.copy2(input_path, backup_path)
        
        # Open and convert image
        with Image.open(input_path) as img:
            # Determine if we should preserve alpha channel
            preserve_alpha = False
            save_img = img
            
            if img.mode in ('RGBA', 'LA', 'P'):
                if input_path.suffix.lower() in {'.png', '.gif', '.jpg', '.jpeg', '.webp'}:
                    # PNG/GIF/misnamed JPG/WebP files - check if they actually have transparency
                    # Convert palette mode to RGBA first
                    if img.mode == 'P':
                        if 'transparency' in img.info:
                            save_img = img.convert('RGBA')
                            preserve_alpha = True
                        else:
                            save_img = img.convert('RGB')
                    elif img.mode in ('RGBA', 'LA'):
                        save_img = img
                        preserve_alpha = True
                else:
                    # Other formats - convert to RGB with white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    save_img = background
            
            # Iteratively reduce quality until image is under 100KB
            MAX_SIZE = 100 * 1024  # 100KB in bytes
            current_quality = quality
            min_quality = 20  # Don't go below this to maintain reasonable image quality
            
            while current_quality >= min_quality:
                # Save as WebP with current quality, preserving alpha if needed
                if preserve_alpha:
                    save_img.save(output_path, 'WEBP', quality=current_quality, method=6, lossless=False)
                else:
                    save_img.save(output_path, 'WEBP', quality=current_quality, method=6)
                new_size = output_path.stat().st_size
                
                # Check if we're under 100KB
                if new_size <= MAX_SIZE:
                    break
                
                # Reduce quality by 5 points and try again
                current_quality -= 5
        
        # Get final size
        new_size = output_path.stat().st_size
        
        # Remove original if it's a different file
        if input_path != output_path:
            input_path.unlink()
        
        action = "Compressed" if input_path.with_suffix('.webp') == output_path and input_path.suffix.lower() == '.webp' else f"Converted to {output_path.name}"
        return True, action, original_size, new_size
    
    except Exception as e:
        return False, f"Error: {str(e)}", original_size if 'original_size' in locals() else 0, 0


def find_yaml_files_with_old_images(root_dir: Path, converted_images: List[Path]) -> List[Tuple[Path, List[str]]]:
    """
    Find YAML files that reference images with old extensions (.jpg, .jpeg, .png).
    Returns list of (file_path, list of old image references).
    """
    import re
    
    yaml_files_with_issues = []
    content_dir = root_dir / 'content'
    
    if not content_dir.exists():
        return yaml_files_with_issues
    
    # Create a set of converted image names (without extension)
    converted_names = {img.stem for img in converted_images}
    
    # Search for YAML files
    for yaml_file in content_dir.rglob('*.yaml'):
        try:
            content = yaml_file.read_text()
            # Find image references with old extensions
            old_refs = re.findall(r'["\']?(/assets/[^"\']+\.(?:jpg|jpeg|png|gif|bmp))["\']?', content)
            
            if old_refs:
                # Filter to only include references to images we actually converted
                relevant_refs = []
                for ref in old_refs:
                    ref_name = Path(ref).stem
                    if ref_name in converted_names:
                        relevant_refs.append(ref)
                
                if relevant_refs:
                    yaml_files_with_issues.append((yaml_file, relevant_refs))
        except Exception:
            continue
    
    return yaml_files_with_issues


def find_images_to_optimize(root_dir: Path) -> List[Path]:
    """
    Find all images that need optimization.
    
    Includes:
    - All non-WebP images (jpg, jpeg, png, gif, bmp) regardless of size
    - WebP images that are over 100KB
    
    Skips:
    - SVG files (vector format)
    - WebP images already under 100KB (already optimized)
    """
    images = []
    MAX_SIZE = 100 * 1024  # 100KB in bytes
    
    for image_dir in IMAGE_DIRS:
        dir_path = root_dir / image_dir
        
        if not dir_path.exists():
            continue
        
        # Recursively find all image files
        for file_path in dir_path.rglob('*'):
            if not file_path.is_file():
                continue
            
            extension = file_path.suffix.lower()
            
            # Skip SVG files
            if extension == SVG_EXTENSION:
                continue
            
            # Always include non-WebP convertible formats
            if extension in CONVERTIBLE_EXTENSIONS:
                images.append(file_path)
            # Only include WebP files if they're over 100KB
            elif extension == '.webp':
                file_size = file_path.stat().st_size
                if file_size > MAX_SIZE:
                    images.append(file_path)
    
    return sorted(images)


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description='Optimize images by converting to WebP format',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        '--quality',
        type=int,
        default=80,
        help='WebP quality (1-100, default: 80)'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='Create .bak backup of original files'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    
    args = parser.parse_args()
    
    # Validate quality
    if args.quality < 1 or args.quality > 100:
        print("❌ ERROR: Quality must be between 1 and 100")
        return 1
    
    print("\n" + "=" * 85)
    print("🔧 CENNSO WEBSITE - IMAGE OPTIMIZATION TOOL")
    print("=" * 85)
    
    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made\n")
    
    print(f"Quality: {args.quality}")
    print(f"Backup: {'Yes' if args.backup else 'No'}")
    print("=" * 85 + "\n")
    
    # Find images
    root_dir = Path(__file__).parent.parent
    images = find_images_to_optimize(root_dir)
    
    if not images:
        print("✅ No images need optimization!")
        print("\nAll images are already:")
        print("  • In WebP format")
        print("  • Under 100KB in size\n")
        return 0
    
    print(f"🔍 Found {len(images)} image(s) to process...\n")
    
    # Process images
    success_count = 0
    error_count = 0
    total_original_size = 0
    total_new_size = 0
    
    print("-" * 115)
    print(f"{'Original File':<40} {'→':<3} {'New File':<22} {'Before':<12} {'After':<12} {'Saved':<12}")
    print("-" * 115)
    
    for img_path in images:
        relative_path = img_path.relative_to(root_dir)
        success, action, orig_size, new_size = optimize_image(
            img_path,
            quality=args.quality,
            backup=args.backup,
            dry_run=args.dry_run
        )
        
        if success:
            success_count += 1
            total_original_size += orig_size
            total_new_size += new_size
            saved = orig_size - new_size
            saved_pct = (saved / orig_size * 100) if orig_size > 0 else 0
            
            # Determine new filename
            if "compress" in action.lower():
                new_filename = img_path.name
            else:
                new_filename = img_path.with_suffix('.webp').name
            
            # Show only filename if path is too long
            display_path = str(relative_path)
            if len(display_path) > 38:
                display_path = "..." + display_path[-35:]
            
            print(f"{display_path:<40} {'→':<3} {new_filename:<22} "
                  f"{human_readable_size(orig_size):<12} "
                  f"{human_readable_size(new_size):<12} "
                  f"-{human_readable_size(saved):<11} ({saved_pct:.0f}%)")
        else:
            error_count += 1
            print(f"❌ {relative_path}: {action}")
    
    print("-" * 100)
    
    # Summary
    total_saved = total_original_size - total_new_size
    total_saved_pct = (total_saved / total_original_size * 100) if total_original_size > 0 else 0
    
    print(f"\n{'TOTAL:':<45} {'':<3} {'':<25} "
          f"{human_readable_size(total_new_size):<12} "
          f"-{human_readable_size(total_saved):<11} ({total_saved_pct:.0f}%)")
    print(f"{'Original total size:':<45} {human_readable_size(total_original_size)}")
    
    print("\n" + "=" * 85)
    print(f"✅ Successfully processed: {success_count}")
    if error_count > 0:
        print(f"❌ Errors: {error_count}")
    print("=" * 85 + "\n")
    
    if args.dry_run:
        print("ℹ️  This was a dry run. Run without --dry-run to apply changes.\n")
    elif success_count > 0:
        print("✅ Images optimized successfully!")
        
        # Check for YAML files that need updating
        yaml_files = find_yaml_files_with_old_images(root_dir, images)
        
        if yaml_files:
            print("\n" + "=" * 85)
            print("⚠️  FILES THAT NEED MANUAL UPDATES")
            print("=" * 85)
            print("\nThe following files reference old image extensions and need to be updated:\n")
            
            for yaml_file, refs in yaml_files:
                relative_path = yaml_file.relative_to(root_dir)
                print(f"📄 {relative_path}")
                for ref in refs:
                    old_ext = Path(ref).suffix
                    new_ref = ref.replace(old_ext, '.webp')
                    print(f"   - {ref}")
                    print(f"     → {new_ref}")
                print()
            
            print("=" * 85)
            print("\n💡 TIP: Use find-and-replace in your editor:")
            print("   .jpg  → .webp")
            print("   .jpeg → .webp")
            print("   .png  → .webp")
            print("=" * 85 + "\n")
        
        print("\nNext steps:")
        print("  1. Review the changes")
        print("  2. Update image references in YAML files (see above)")
        print("  3. Run 'yarn perf:images' to verify optimization")
        print("  4. Run 'yarn build' to ensure no broken references")
        print("  5. Commit the optimized images and updated references\n")
    
    return 1 if error_count > 0 else 0


if __name__ == '__main__':
    sys.exit(main())
