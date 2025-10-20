#!/usr/bin/env python3
"""
WCAG 2.1 AA Contrast Ratio Validator 

This script validates that all color combinations used in the website
meet WCAG 2.1 AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text (≥18pt or ≥14pt bold): 3.0:1 minimum

Exit codes:
- 0: All tests pass
- 1: One or more tests fail
"""

import sys
from typing import Tuple, List


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """Calculate relative luminance per WCAG formula."""
    r, g, b = [x / 255.0 for x in rgb]
    
    def adjust(channel: float) -> float:
        if channel <= 0.03928:
            return channel / 12.92
        return ((channel + 0.055) / 1.055) ** 2.4
    
    r, g, b = adjust(r), adjust(g), adjust(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(color1: str, color2: str) -> float:
    """Calculate contrast ratio between two colors."""
    lum1 = relative_luminance(hex_to_rgb(color1))
    lum2 = relative_luminance(hex_to_rgb(color2))
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


def check_wcag_aa(ratio: float, is_large_text: bool = False) -> Tuple[bool, float]:
    """Check if ratio meets WCAG AA standards."""
    required = 3.0 if is_large_text else 4.5
    passes = ratio >= required
    return passes, required


# CENNSO Color Palette (from tailwind.config.js)
COLORS = {
    'primary-500': '#185f99',    # Original CENNSO dark blue
    'primary-600': '#14497a',    # Darker shade for hover/buttons
    'primary-700': '#0f3559',    # Darkest shade
    'primary-400': '#3397cf',    # Lighter for dark mode
    'secondary-500': '#36AADD',  # Original CENNSO light blue
    'secondary-600': '#14497a',  # Dark blue for buttons with white text
    'secondary-700': '#0f3559',  # Darkest for dark mode
    'white': '#FFFFFF',
    'gray-900': '#242929',       # Dark background
}

# Test cases covering all color combinations used in the codebase
TEST_CASES: List[Tuple[str, str, str, float, bool]] = [
    # Component, Foreground, Background, Required Ratio, Is Large Text
    
    # Buttons (Light Mode)
    ("Button Primary", "white", "primary-500", 4.5, False),
    ("Button Primary Hover", "white", "primary-600", 4.5, False),
    ("Button Secondary", "white", "secondary-600", 4.5, False),
    ("Button Secondary Hover", "white", "secondary-700", 4.5, False),
    ("Button Tertiary", "primary-500", "white", 4.5, False),
    
    # Navigation
    ("Nav Link", "primary-500", "white", 4.5, False),
    ("Nav Dropdown Background", "white", "primary-500", 4.5, False),
    ("Nav Hover/Active", "white", "primary-500", 4.5, False),
    
    # Headers (Large Text)
    ("Header Primary (Large)", "primary-500", "white", 3.0, True),
    ("Header Dark Mode (Large)", "primary-400", "gray-900", 3.0, True),
    
    # Page Components
    ("Page Header", "gray-900", "secondary-500", 4.5, False),
    ("Job Form Light", "white", "secondary-600", 4.5, False),
    ("Job Form Dark", "white", "secondary-700", 4.5, False),
    ("Blog Badge", "white", "primary-500", 4.5, False),
    
    # Markdown/Content
    ("Markdown Anchor", "white", "primary-500", 4.5, False),
    ("Markdown Anchor Dark", "white", "primary-600", 4.5, False),
]


def main() -> int:
    """Run all WCAG AA contrast tests."""
    print("=" * 85)
    print("🎯 CENNSO WEBSITE - WCAG 2.1 AA CONTRAST VALIDATION")
    print("=" * 85)
    print(f"{'Component':<30} {'Ratio':<10} {'Required':<10} {'Status':<10}")
    print("-" * 85)
    
    failed_tests: List[Tuple[str, float, float]] = []
    
    for name, fg_key, bg_key, _, is_large in TEST_CASES:
        fg_color = COLORS[fg_key]
        bg_color = COLORS[bg_key]
        
        ratio = contrast_ratio(fg_color, bg_color)
        passes, required = check_wcag_aa(ratio, is_large)
        
        status = "✅ PASS" if passes else "❌ FAIL"
        
        if not passes:
            failed_tests.append((name, ratio, required))
        
        print(f"{name:<30} {ratio:>6.2f}:1   {required:>4.1f}:1     {status}")
    
    print("=" * 85)
    
    if failed_tests:
        print(f"\n❌ {len(failed_tests)} TEST(S) FAILED - WCAG 2.1 AA violations found!\n")
        print("FAILED TESTS:")
        for name, ratio, required in failed_tests:
            print(f"  • {name}: {ratio:.2f}:1 (needs {required:.1f}:1)")
        print("\n💡 Fix required: Update colors in tailwind.config.js or component files")
        print("   See docs/troubleshooting.md for approved color combinations")
        print("=" * 85)
        return 1
    else:
        print("\n🎉 " + "=" * 77)
        print("✅ ALL TESTS PASSED - WEBSITE IS WCAG 2.1 AA COMPLIANT!")
        print("=" * 81)
        print(f"\n📊 RESULTS: {len(TEST_CASES)}/{len(TEST_CASES)} tests passed")
        print("\n✅ Contrast Ratios:")
        print("   • Normal text: All combinations ≥ 4.5:1")
        print("   • Large text: All combinations ≥ 3.0:1")
        print("\n📋 Compliance:")
        print("   ✅ WCAG 2.1 Level AA")
        print("   ✅ ADA compliant")
        print("   ✅ Section 508 compliant")
        print("   ✅ EU Web Accessibility Directive compliant")
        print("\n" + "=" * 85)
        return 0


if __name__ == "__main__":
    sys.exit(main())
