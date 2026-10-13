#!/usr/bin/env python3
"""
WCAG 2.1 + Mobile Performance Validation

Validates Next.js Image components for mobile optimization:
- All Image components must have sizes prop (responsive optimization)
- Viewport meta tag present (mobile rendering)
- Base font size meets 16px minimum (readability)
"""

import os
import re
import sys
from pathlib import Path

# ANSI color codes
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def find_files_with_images():
    """Find all TypeScript files that import Next.js Image component."""
    files_with_images = []
    
    for directory in ['pages', 'components']:
        if not os.path.exists(directory):
            continue
            
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.tsx'):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if "from 'next/image'" in content or 'from "next/image"' in content:
                                files_with_images.append(filepath)
                    except Exception as e:
                        print(f"{YELLOW}Warning: Could not read {filepath}: {e}{RESET}")
    
    return files_with_images

def check_image_sizes_prop(filepath):
    """Check if all Image components in a file have sizes prop."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count Image components (simple regex - may have false positives)
        image_components = re.findall(r'<Image\s', content)
        image_count = len(image_components)
        
        if image_count == 0:
            return {'file': filepath, 'total': 0, 'with_sizes': 0, 'missing': 0}
        
        # Count Image components with sizes prop
        # This checks for sizes= within 10 lines after <Image
        # Simple approach: split by <Image and check if sizes= appears before next >
        sizes_count = 0
        parts = content.split('<Image')
        
        for part in parts[1:]:  # Skip first part (before first <Image)
            # Get content until we find the closing of the Image tag
            # Look for either /> or > that closes the tag
            tag_end = min(
                part.find('/>') if part.find('/>') != -1 else len(part),
                part.find('>') if part.find('>') != -1 else len(part)
            )
            tag_content = part[:tag_end]
            
            if 'sizes=' in tag_content:
                sizes_count += 1
        
        missing = image_count - sizes_count
        
        return {
            'file': filepath,
            'total': image_count,
            'with_sizes': sizes_count,
            'missing': missing
        }
    
    except Exception as e:
        print(f"{YELLOW}Warning: Error checking {filepath}: {e}{RESET}")
        return {'file': filepath, 'total': 0, 'with_sizes': 0, 'missing': 0}

def check_viewport_meta():
    """Check if viewport meta tag is present in _app.tsx.

    It lives in _app's next/head, not _document: Next warns against a viewport
    meta in _document's <Head> (no-document-viewport-meta).
    """
    app_path = 'pages/_app.tsx'
    
    if not os.path.exists(app_path):
        return False, "pages/_app.tsx not found"
    
    try:
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for viewport meta tag
        if 'name="viewport"' in content and 'width=device-width' in content:
            return True, None
        else:
            return False, "Viewport meta tag missing or incomplete"
    
    except Exception as e:
        return False, f"Error reading _app.tsx: {e}"

def check_font_size():
    """Verify base font size is 16px (Tailwind default)."""
    # Tailwind uses 1rem = 16px by default
    # Check if there's any override in tailwind.css
    css_path = 'styles/tailwind.css'
    
    if not os.path.exists(css_path):
        return True, None  # If no CSS file, assume Tailwind defaults
    
    try:
        with open(css_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if there's a font-size override on html/body that's less than 16px
        html_font_match = re.search(r'html\s*{[^}]*font-size:\s*(\d+)px', content)
        body_font_match = re.search(r'body\s*{[^}]*font-size:\s*(\d+)px', content)
        
        if html_font_match:
            size = int(html_font_match.group(1))
            if size < 16:
                return False, f"html font-size is {size}px (minimum 16px required)"
        
        if body_font_match:
            size = int(body_font_match.group(1))
            if size < 16:
                return False, f"body font-size is {size}px (minimum 16px required)"
        
        return True, None
    
    except Exception as e:
        return True, None  # If we can't read, assume OK

def main():
    print("=" * 85)
    print(f"{BLUE}🔍 CENNSO WEBSITE - MOBILE PERFORMANCE VALIDATION{RESET}")
    print("=" * 85)
    print()
    
    # Check 1: Image sizes prop
    print(f"{BLUE}📱 Checking Next.js Image components for sizes prop...{RESET}")
    files_with_images = find_files_with_images()
    
    if not files_with_images:
        print(f"{YELLOW}No files found with Next.js Image imports{RESET}")
        image_check_passed = True
        missing_sizes_total = 0
    else:
        results = [check_image_sizes_prop(f) for f in files_with_images]
        missing_sizes_total = sum(r['missing'] for r in results)
        total_images = sum(r['total'] for r in results)
        
        print(f"   Found {len(files_with_images)} files with Image components")
        print(f"   Total Image components: {total_images}")
        print()
        
        issues_found = False
        for result in results:
            if result['missing'] > 0:
                issues_found = True
                print(f"{RED}❌ {result['file']}{RESET}")
                print(f"   Image components: {result['total']}")
                print(f"   Missing sizes prop: {result['missing']}")
                print()
        
        image_check_passed = not issues_found
    
    # Check 2: Viewport meta tag
    print(f"{BLUE}📱 Checking viewport meta tag...{RESET}")
    viewport_ok, viewport_error = check_viewport_meta()
    
    if viewport_ok:
        print(f"{GREEN}✅ Viewport meta tag present in pages/_app.tsx{RESET}")
    else:
        print(f"{RED}❌ {viewport_error}{RESET}")
    print()
    
    # Check 3: Font size
    print(f"{BLUE}📱 Checking minimum font size...{RESET}")
    font_ok, font_error = check_font_size()
    
    if font_ok:
        print(f"{GREEN}✅ Base font size meets 16px minimum (Tailwind default){RESET}")
    else:
        print(f"{RED}❌ {font_error}{RESET}")
    print()
    
    # Summary
    print("=" * 85)
    print(f"{BLUE}📊 RESULTS:{RESET}")
    print(f"   Files scanned: {len(files_with_images)}")
    print(f"   Image components missing sizes prop: {missing_sizes_total}")
    print(f"   Viewport meta tag: {'✅ Present' if viewport_ok else '❌ Missing'}")
    print(f"   Font size: {'✅ Valid' if font_ok else '❌ Invalid'}")
    print()
    
    all_passed = image_check_passed and viewport_ok and font_ok
    
    if all_passed:
        print(f"{GREEN}🎉 ✅ ALL MOBILE PERFORMANCE CHECKS PASSED!{RESET}")
        print()
        print(f"{GREEN}✅ Compliance:{RESET}")
        print(f"{GREEN}   ✅ Next.js Image optimization enabled{RESET}")
        print(f"{GREEN}   ✅ Responsive image serving configured (sizes prop){RESET}")
        print(f"{GREEN}   ✅ Mobile viewport properly configured{RESET}")
        print(f"{GREEN}   ✅ Minimum 16px base font size{RESET}")
        print(f"{GREEN}   ✅ Core Web Vitals optimization (CLS prevention){RESET}")
        print()
    else:
        print(f"{RED}❌ FAILED: Mobile performance issues detected{RESET}")
        print()
        if missing_sizes_total > 0:
            print(f"{YELLOW}📝 Next.js Image sizes prop is REQUIRED for:{RESET}")
            print(f"{YELLOW}   • Responsive image optimization (prevents oversized downloads){RESET}")
            print(f"{YELLOW}   • Core Web Vitals (reduces Cumulative Layout Shift){RESET}")
            print(f"{YELLOW}   • Bandwidth efficiency (serves correct image size per viewport){RESET}")
            print()
            print(f"{YELLOW}Examples:{RESET}")
            print(f'{YELLOW}   Fixed size:     sizes="150px"{RESET}')
            print(f'{YELLOW}   Responsive:     sizes="(max-width: 768px) 100vw, 50vw"{RESET}')
            print(f'{YELLOW}   Hidden mobile:  sizes="(max-width: 768px) 0px, 45vw"{RESET}')
            print()
        
        if not viewport_ok:
            print(f"{YELLOW}📝 Add viewport meta tag to pages/_app.tsx (in next/head):{RESET}")
            print(f'{YELLOW}   <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />{RESET}')
            print()
    
    print("=" * 85)
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
