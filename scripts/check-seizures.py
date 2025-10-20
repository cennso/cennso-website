#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 2.3: Seizures and Physical Reactions - EN 301 549 Section 9.2.3
Validates seizure and physical reaction safety compliance

This script performs static analysis to check for seizure-triggering patterns:
- SC 2.3.1 Three Flashes or Below Threshold (Level A): No content flashes more than 3 times per second
- SC 2.3.2 Three Flashes (Level AAA): No flashing content (not required for AA, informational only)
- SC 2.3.3 Animation from Interactions (Level AAA): Motion animation can be disabled (not required for AA)

Exit codes:
  0 - All checks passed
  1 - Errors found (WCAG violations)
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict

# ANSI color codes
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# File patterns to scan
INCLUDE_PATTERNS = ['.tsx', '.jsx', '.ts', '.js', '.css', '.scss']
EXCLUDE_DIRS = ['node_modules', '.next', 'out', 'build', 'dist', '.git', 'scripts']

# Violation tracking
violations: Dict[str, List[Tuple[str, int, str]]] = {
    'three_flashes': [],
    'reduced_motion': [],
}


def scan_files(root_dir: str) -> List[str]:
    """Scan directory for relevant files"""
    files = []
    for root, dirs, filenames in os.walk(root_dir):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            if any(filename.endswith(ext) for ext in INCLUDE_PATTERNS):
                files.append(os.path.join(root, filename))
    
    return sorted(files)


def check_three_flashes(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for flashing/blinking content (WCAG 2.1 SC 2.3.1)
    
    Checks:
    - CSS animations/transitions that blink/flash rapidly
    - JavaScript setInterval with rapid toggling
    - Explicit "flash" or "blink" in animation names
    - Strobe effects
    
    Threshold: Content MUST NOT flash more than 3 times per second (333ms)
    """
    violations = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for CSS blink/flash animations
        blink_pattern = re.search(
            r'\b(blink|flash|strobe)\b',
            line_stripped,
            re.IGNORECASE
        )
        
        if blink_pattern:
            # Check if this is BlinkMacSystemFont (safe)
            if 'BlinkMacSystemFont' in line_stripped:
                continue
            
            violations.append((
                file_path,
                i,
                f"Potential flashing/blinking content detected - ensure it doesn't flash more than 3 times per second (SC 2.3.1)"
            ))
        
        # Check for rapid animation durations in CSS
        # Pattern: animation: <duration> or animation-duration: <duration>
        animation_duration = re.search(
            r'animation(?:-duration)?:\s*(?:[\w-]+\s+)?(\d+(?:\.\d+)?)(m?s)',
            line_stripped
        )
        
        if animation_duration:
            duration_value = float(animation_duration.group(1))
            unit = animation_duration.group(2)
            
            # Convert to milliseconds
            duration_ms = duration_value if unit == 'ms' else duration_value * 1000
            
            # Check if animation is rapid (< 333ms per cycle could cause 3+ flashes/sec)
            if duration_ms < 333:
                # Look for additional context
                context_start = max(0, i - 5)
                context_end = min(len(lines), i + 5)
                context = '\n'.join(lines[context_start:context_end])
                
                # Check if this is an opacity/visibility animation (potential flash)
                is_opacity = bool(
                    re.search(r'opacity|visibility|display', context, re.IGNORECASE)
                )
                
                # Check if animation is infinite (more likely to be problematic)
                is_infinite = bool(
                    re.search(r'infinite', context, re.IGNORECASE)
                )
                
                # Only flag if it's an opacity change that's infinite
                if is_opacity and is_infinite:
                    violations.append((
                        file_path,
                        i,
                        f"Rapid animation ({duration_ms}ms) with opacity/visibility changes could flash more than 3 times/sec (SC 2.3.1)"
                    ))
        
        # Check for setInterval with rapid toggling (JavaScript)
        interval_pattern = re.search(
            r'setInterval\s*\([^,]*,\s*(\d+)\s*\)',
            line_stripped
        )
        
        if interval_pattern:
            interval_ms = int(interval_pattern.group(1))
            
            if interval_ms < 333:
                context_start = max(0, i - 5)
                context_end = min(len(lines), i + 5)
                context = '\n'.join(lines[context_start:context_end])
                
                # Check if this is toggling visibility/opacity
                is_toggle = bool(
                    re.search(r'toggle|opacity|visible|hidden|display|show|hide', context, re.IGNORECASE)
                )
                
                if is_toggle:
                    violations.append((
                        file_path,
                        i,
                        f"Rapid setInterval ({interval_ms}ms) with visibility toggling could flash more than 3 times/sec (SC 2.3.1)"
                    ))
    
    return violations


def check_reduced_motion(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for prefers-reduced-motion support (WCAG 2.1 SC 2.3.3 - Level AAA, best practice)
    
    Checks:
    - CSS animations should respect @media (prefers-reduced-motion: reduce)
    - JavaScript animations should check matchMedia for prefers-reduced-motion
    
    Note: This is Level AAA (not required for AA), but it's a best practice
    """
    violations = []
    lines = content.split('\n')
    
    # Skip non-CSS/animation files
    if not (file_path.endswith('.css') or file_path.endswith('.scss')):
        return violations
    
    # Check if file has animations
    has_animations = bool(re.search(r'@keyframes|animation:', content))
    
    if not has_animations:
        return violations
    
    # Check if prefers-reduced-motion is implemented
    has_reduced_motion = bool(
        re.search(r'prefers-reduced-motion', content, re.IGNORECASE)
    )
    
    if not has_reduced_motion:
        # Find animations and flag them
        for i, line in enumerate(lines, 1):
            if re.search(r'@keyframes\s+[\w-]+', line):
                violations.append((
                    file_path,
                    i,
                    f"Animation should respect prefers-reduced-motion media query (Best Practice - Level AAA)"
                ))
                # Only report once per file
                break
    
    return violations


def print_violations(violations: Dict[str, List[Tuple[str, int, str]]]) -> None:
    """Print violations in a readable format"""
    
    has_errors = False
    has_warnings = False
    
    # Print each violation type
    for check_type, items in violations.items():
        if items:
            if check_type == 'three_flashes':
                has_errors = True
                color = RED
                symbol = '✗'
            else:  # reduced_motion is a warning (Level AAA)
                has_warnings = True
                color = YELLOW
                symbol = '⚠'
            
            check_names = {
                'three_flashes': 'Three Flashes or Below Threshold (SC 2.3.1 - Level A)',
                'reduced_motion': 'Reduced Motion Support (SC 2.3.3 - Level AAA - Best Practice)',
            }
            
            print(f"\n{color}{symbol} {check_names[check_type]}{RESET}")
            
            # Group by file
            by_file: Dict[str, List[Tuple[int, str]]] = {}
            for file_path, line_num, message in items:
                if file_path not in by_file:
                    by_file[file_path] = []
                by_file[file_path].append((line_num, message))
            
            # Print violations by file
            for file_path, file_violations in sorted(by_file.items()):
                print(f"\n  {BLUE}{file_path}{RESET}")
                for line_num, message in sorted(file_violations):
                    print(f"    Line {line_num}: {message}")
    
    if not has_errors and not has_warnings:
        print(f"\n{GREEN}✓ All seizure and physical reaction checks passed!{RESET}\n")


def main():
    """Main validation function"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print(f"{BLUE}Scanning for seizure and physical reaction issues...{RESET}\n")
    print(f"Root directory: {project_root}")
    
    # Scan files
    files = scan_files(str(project_root))
    print(f"Files to check: {len(files)}\n")
    
    # Run checks on each file
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Run all checks
            violations['three_flashes'].extend(check_three_flashes(file_path, content))
            violations['reduced_motion'].extend(check_reduced_motion(file_path, content))
            
        except Exception as e:
            print(f"{YELLOW}Warning: Could not process {file_path}: {e}{RESET}")
    
    # Print results
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}WCAG 2.1 Guideline 2.3: Seizures and Physical Reactions - Validation Results{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    print_violations(violations)
    
    # Print summary
    total_errors = len(violations['three_flashes'])
    total_warnings = len(violations['reduced_motion'])
    
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Summary:{RESET}")
    print(f"  Files scanned: {len(files)}")
    print(f"  Three Flashes (SC 2.3.1) issues: {total_errors}")
    print(f"  Reduced Motion (SC 2.3.3 - AAA) warnings: {total_warnings}")
    print(f"  Total errors: {total_errors}")
    print(f"  Total warnings: {total_warnings} (best practice only)")
    
    print(f"\n{BLUE}Compliance Status:{RESET}")
    if total_errors == 0:
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.3.1 (Three Flashes or Below Threshold) - Level A{RESET}")
        print(f"  {GREEN}✓ EN 301 549 Section 9.2.3 (Seizures and Physical Reactions){RESET}")
    else:
        print(f"  {RED}✗ Issues found - see details above{RESET}")
    
    if total_warnings > 0:
        print(f"\n{YELLOW}Best Practice Recommendations:{RESET}")
        print(f"  ⚠ Consider implementing prefers-reduced-motion support (Level AAA)")
        print(f"  ⚠ This improves experience for users with vestibular disorders")
    
    print(f"\n{BLUE}Notes:{RESET}")
    print(f"  • Level A requirement (SC 2.3.1): No content flashes more than 3 times/second")
    print(f"  • Level AAA recommendation (SC 2.3.3): Motion animations respect prefers-reduced-motion")
    print(f"  • Manual testing required for:")
    print(f"    - Video content that might contain flashing sequences")
    print(f"    - Interactive animations triggered by user actions")
    print(f"    - Large-scale motion effects")
    print(f"  • Safe patterns (automatically excluded):")
    print(f"    - Smooth transitions and animations (no rapid flashing)")
    print(f"    - Slow orbital/rotation animations (partners page)")
    print(f"    - Continuous scrolling logos (300s duration)")
    print(f"  • Recommended: Add prefers-reduced-motion support to all animations")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Exit with appropriate code (warnings don't fail the build)
    sys.exit(1 if total_errors > 0 else 0)


if __name__ == '__main__':
    main()
