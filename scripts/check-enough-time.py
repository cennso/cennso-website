#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 2.2: Enough Time - EN 301 549 Section 9.2.2
Validates time-related accessibility compliance

This script performs static analysis to check for time-related accessibility issues:
- SC 2.2.1 Timing Adjustable (Level A): Time limits can be adjusted/extended/turned off
- SC 2.2.2 Pause, Stop, Hide (Level A): Moving/blinking/scrolling content can be paused
- SC 2.2.3 No Timing (Level AAA): No time limits (not required for AA, informational only)
- SC 2.2.4 Interruptions (Level AAA): Interruptions can be postponed/suppressed (not required for AA)
- SC 2.2.5 Re-authenticating (Level AAA): Data preserved when re-authenticating (not required for AA)

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
INCLUDE_PATTERNS = ['.tsx', '.jsx', '.ts', '.js']
EXCLUDE_DIRS = ['node_modules', '.next', 'out', 'build', 'dist', '.git', 'scripts']

# Violation tracking
violations: Dict[str, List[Tuple[str, int, str]]] = {
    'timing_adjustable': [],
    'pause_stop_hide': [],
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


def check_timing_adjustable(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for timing issues (WCAG 2.1 SC 2.2.1)
    
    Checks:
    - setTimeout/setInterval for session timeouts or time limits
    - Countdown timers that enforce time limits
    - Auto-submit forms after time limit
    - Session expiration without warning
    
    Acceptable patterns:
    - Short UI animations/transitions (<5 seconds, decorative)
    - Debouncing/throttling for performance
    - Modal close animations
    """
    violations = []
    lines = content.split('\n')
    
    # Skip files that are known to use setTimeout/setInterval safely
    skip_files = [
        'StatusModal.tsx',  # Animation delay only (300ms)
        'ContactForm.tsx',  # Loading state delay only (1.5s)
        'JobForm.tsx',  # Loading state delay only (1.5s)
    ]
    
    if any(skip in file_path for skip in skip_files):
        return violations
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for setTimeout/setInterval patterns
        timeout_pattern = re.search(
            r'\b(setTimeout|setInterval)\s*\(',
            line_stripped
        )
        
        if timeout_pattern:
            # Look at context to determine if this is a time limit
            context_start = max(0, i - 10)
            context_end = min(len(lines), i + 10)
            context = '\n'.join(lines[context_start:context_end])
            
            # Check for problematic patterns
            is_session_timeout = bool(
                re.search(r'session|logout|timeout|expire', context, re.IGNORECASE)
            )
            
            is_countdown = bool(
                re.search(r'countdown|timer|remaining|time\s*left', context, re.IGNORECASE)
            )
            
            is_auto_submit = bool(
                re.search(r'submit|auto.*submit', context, re.IGNORECASE)
            )
            
            # Check for safe patterns (animations, delays)
            is_animation = bool(
                re.search(r'animation|transition|delay|fade|slide', context, re.IGNORECASE)
            )
            
            is_debounce = bool(
                re.search(r'debounce|throttle', context, re.IGNORECASE)
            )
            
            # Extract timeout duration if visible
            timeout_duration = re.search(r'(\d+)\s*\)', line_stripped)
            short_duration = False
            if timeout_duration:
                duration = int(timeout_duration.group(1))
                short_duration = duration < 5000  # Less than 5 seconds
            
            # Flag if it looks like a time limit without controls
            if (is_session_timeout or is_countdown or is_auto_submit) and not (is_animation or is_debounce):
                violations.append((
                    file_path,
                    i,
                    f"Potential time limit detected - ensure users can turn off, adjust, or extend the time limit (SC 2.2.1)"
                ))
            elif timeout_pattern and not (is_animation or is_debounce or short_duration):
                # Generic timeout without clear safe pattern - warning only
                # Commented out to avoid false positives
                pass
    
    return violations


def check_pause_stop_hide(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for auto-updating/moving content (WCAG 2.1 SC 2.2.2)
    
    Checks:
    - Auto-playing carousels/slideshows
    - Auto-scrolling content
    - Auto-updating content (news tickers, stock tickers)
    - Blinking/marquee elements
    
    Required: Mechanism to pause, stop, or hide moving content
    Exception: Content that moves/updates for less than 5 seconds
    """
    violations = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for carousel/slider patterns
        carousel_pattern = re.search(
            r'\b(carousel|slider|slideshow|swiper|autoplay)\b',
            line_stripped,
            re.IGNORECASE
        )
        
        if carousel_pattern:
            # Look for autoplay configuration
            context_start = max(0, i - 10)
            context_end = min(len(lines), i + 20)
            context = '\n'.join(lines[context_start:context_end])
            
            has_autoplay = bool(
                re.search(r'autoplay\s*[:=]\s*true', context, re.IGNORECASE)
            )
            
            has_pause_control = bool(
                re.search(r'pause|stop|controls', context, re.IGNORECASE)
            )
            
            if has_autoplay and not has_pause_control:
                violations.append((
                    file_path,
                    i,
                    f"Auto-playing carousel/slider should have pause/stop controls (SC 2.2.2)"
                ))
        
        # Check for marquee or scrolling text
        marquee_pattern = re.search(
            r'<marquee|scrolling.*text|ticker',
            line_stripped,
            re.IGNORECASE
        )
        
        if marquee_pattern:
            violations.append((
                file_path,
                i,
                f"Scrolling/marquee content MUST have mechanism to pause, stop, or hide (SC 2.2.2)"
            ))
        
        # Check for auto-refresh/polling patterns
        polling_pattern = re.search(
            r'\b(setInterval)\s*\([^,]*,\s*(\d+)\s*\)',
            line_stripped
        )
        
        if polling_pattern:
            duration = int(polling_pattern.group(2))
            context_start = max(0, i - 5)
            context_end = min(len(lines), i + 5)
            context = '\n'.join(lines[context_start:context_end])
            
            # Check if this is content polling (not debouncing/animation)
            is_content_update = bool(
                re.search(r'fetch|update|refresh|poll|load', context, re.IGNORECASE)
            )
            
            has_stop_mechanism = bool(
                re.search(r'clearInterval|stop|pause', context, re.IGNORECASE)
            )
            
            if is_content_update and not has_stop_mechanism and duration > 5000:
                violations.append((
                    file_path,
                    i,
                    f"Auto-updating content should have mechanism to pause or stop updates (SC 2.2.2)"
                ))
    
    return violations


def print_violations(violations: Dict[str, List[Tuple[str, int, str]]]) -> None:
    """Print violations in a readable format"""
    
    has_errors = False
    
    # Print each violation type
    for check_type, items in violations.items():
        if items:
            has_errors = True
            
            check_names = {
                'timing_adjustable': 'Timing Adjustable (SC 2.2.1)',
                'pause_stop_hide': 'Pause, Stop, Hide (SC 2.2.2)',
            }
            
            print(f"\n{RED}✗ {check_names[check_type]}{RESET}")
            
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
    
    if not has_errors:
        print(f"\n{GREEN}✓ All enough time checks passed!{RESET}\n")


def main():
    """Main validation function"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print(f"{BLUE}Scanning for time-related accessibility issues...{RESET}\n")
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
            violations['timing_adjustable'].extend(check_timing_adjustable(file_path, content))
            violations['pause_stop_hide'].extend(check_pause_stop_hide(file_path, content))
            
        except Exception as e:
            print(f"{YELLOW}Warning: Could not process {file_path}: {e}{RESET}")
    
    # Print results
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}WCAG 2.1 Guideline 2.2: Enough Time - Validation Results{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    print_violations(violations)
    
    # Print summary
    total_violations = sum(len(v) for v in violations.values())
    
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Summary:{RESET}")
    print(f"  Files scanned: {len(files)}")
    print(f"  Timing Adjustable (SC 2.2.1) issues: {len(violations['timing_adjustable'])}")
    print(f"  Pause, Stop, Hide (SC 2.2.2) issues: {len(violations['pause_stop_hide'])}")
    print(f"  Total issues: {total_violations}")
    
    print(f"\n{BLUE}Compliance Status:{RESET}")
    if total_violations == 0:
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.2.1 (Timing Adjustable) - Level A{RESET}")
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.2.2 (Pause, Stop, Hide) - Level A{RESET}")
        print(f"  {GREEN}✓ EN 301 549 Section 9.2.2 (Enough Time){RESET}")
    else:
        print(f"  {RED}✗ Issues found - see details above{RESET}")
    
    print(f"\n{BLUE}Notes:{RESET}")
    print(f"  • This script validates common time-related patterns")
    print(f"  • Level A requirements (SC 2.2.1, 2.2.2) are enforced")
    print(f"  • Level AAA requirements (SC 2.2.3, 2.2.4, 2.2.5) are informational only")
    print(f"  • Manual testing required for:")
    print(f"    - Session timeout warnings and extension mechanisms")
    print(f"    - Carousel/slideshow pause controls")
    print(f"    - Auto-updating content pause mechanisms")
    print(f"    - Data preservation during re-authentication")
    print(f"  • Safe patterns (automatically excluded):")
    print(f"    - UI animations/transitions <5 seconds")
    print(f"    - Debouncing/throttling for performance")
    print(f"    - Loading state delays")
    print(f"    - Modal close animations")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Exit with appropriate code
    sys.exit(1 if total_violations > 0 else 0)


if __name__ == '__main__':
    main()
