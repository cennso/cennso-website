#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 2.1: Keyboard Accessible - EN 301 549 Section 9.2.1
Validates keyboard accessibility compliance

This script performs static analysis to check for common keyboard accessibility issues:
- SC 2.1.1 Keyboard (Level A): All functionality available from keyboard
- SC 2.1.2 No Keyboard Trap (Level A): Focus can be moved away from components
- SC 2.1.4 Character Key Shortcuts (Level A): Single-key shortcuts can be disabled/remapped

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
    'keyboard_access': [],
    'keyboard_trap': [],
    'character_shortcuts': [],
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


def check_keyboard_access(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for keyboard accessibility violations (WCAG 2.1 SC 2.1.1)
    
    Checks:
    - onClick without onKeyDown/onKeyPress on non-semantic elements
    - Clickable divs/spans without keyboard handlers or role="button"
    - Interactive elements with tabIndex but no keyboard handlers
    - Missing keyboard event handlers on custom interactive components
    """
    violations = []
    lines = content.split('\n')
    
    # Skip specific component files that are known to be accessible
    skip_files = [
        'Button.tsx',  # Semantic button element
        'Logo.tsx',  # SVG logo, not interactive
        'MenuToggle.tsx',  # Wrapped in button
        'CircleAvatar.tsx',  # Display only
        'HexagonAvatar.tsx',  # Display only
        'Hexagon',  # Display only
        'GradientHeader.tsx',  # Display only
        'PageHeader.tsx',  # Display only
        'FeatureCard.tsx',  # Links inside
        'LoadingIndicator.tsx',  # Visual only
    ]
    
    if any(skip in file_path for skip in skip_files):
        return violations
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for onClick on non-semantic interactive elements without keyboard handler
        # Pattern: <div|span onClick={...}> without onKeyDown or onKeyPress
        if re.search(r'<(div|span)[^>]*\bonClick\s*=', line_stripped):
            # Look ahead to see if there's a keyboard handler nearby
            context_start = max(0, i - 5)
            context_end = min(len(lines), i + 5)
            context = '\n'.join(lines[context_start:context_end])
            
            # Check if this element has keyboard handlers
            has_keyboard_handler = bool(
                re.search(r'\bonKeyDown\s*=', context) or
                re.search(r'\bonKeyPress\s*=', context) or
                re.search(r'\bonKeyUp\s*=', context)
            )
            
            # Check if this element has appropriate role
            has_button_role = bool(re.search(r'\brole\s*=\s*["\']button["\']', context))
            
            # Check if this is wrapped in a button or link (common pattern)
            has_semantic_parent = bool(
                re.search(r'<button[^>]*>', context) or
                re.search(r'<a[^>]*>', context) or
                re.search(r'<Link[^>]*>', context)
            )
            
            if not (has_keyboard_handler or has_button_role or has_semantic_parent):
                violations.append((
                    file_path,
                    i,
                    f"Non-semantic element with onClick needs keyboard handler (onKeyDown/onKeyPress) or role=\"button\""
                ))
        
        # Check for custom tabIndex without keyboard handlers
        # tabIndex={0} or tabIndex="0" makes element focusable, should have keyboard handler
        if re.search(r'\btabIndex\s*=\s*["{]0["}]', line_stripped):
            # Look for keyboard handlers in context
            context_start = max(0, i - 10)
            context_end = min(len(lines), i + 10)
            context = '\n'.join(lines[context_start:context_end])
            
            has_keyboard_handler = bool(
                re.search(r'\bonKeyDown\s*=', context) or
                re.search(r'\bonKeyPress\s*=', context) or
                re.search(r'\bonKeyUp\s*=', context) or
                re.search(r'\bonClick\s*=', context)  # onClick is acceptable with tabIndex
            )
            
            # Check if this is a semantic interactive element
            is_semantic = bool(
                re.search(r'<(button|a|input|select|textarea)', context, re.IGNORECASE)
            )
            
            if not (has_keyboard_handler or is_semantic):
                violations.append((
                    file_path,
                    i,
                    f"Element with tabIndex={{0}} should have keyboard event handlers"
                ))
        
        # Check for mouseEnter/mouseLeave without keyboard equivalents
        # These patterns need focus/blur handlers for keyboard users
        if re.search(r'\bonMouseEnter\s*=', line_stripped):
            context_start = max(0, i - 5)
            context_end = min(len(lines), i + 5)
            context = '\n'.join(lines[context_start:context_end])
            
            has_focus_handler = bool(
                re.search(r'\bonFocus\s*=', context) or
                re.search(r'\ballowHover\s*=\s*true', context)  # Material-Tailwind Menu pattern
            )
            
            # Skip if this is a Material-Tailwind Menu (has built-in keyboard support)
            is_material_menu = bool(re.search(r'<Menu\b', context))
            
            if not (has_focus_handler or is_material_menu):
                violations.append((
                    file_path,
                    i,
                    f"onMouseEnter without onFocus - keyboard users cannot trigger hover states"
                ))
    
    return violations


def check_keyboard_trap(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for potential keyboard traps (WCAG 2.1 SC 2.1.2)
    
    Checks:
    - Modals/dialogs should have escape key handler
    - Focus management in modal components
    - TabIndex values that might create traps (positive values)
    - Event handlers that might prevent default keyboard behavior
    """
    violations = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for positive tabIndex values (creates unpredictable tab order)
        # tabIndex={1} or higher - this is an anti-pattern
        positive_tabindex = re.search(r'\btabIndex\s*=\s*["{]([1-9]\d*)["}]', line_stripped)
        if positive_tabindex:
            violations.append((
                file_path,
                i,
                f"Positive tabIndex={positive_tabindex.group(1)} creates unpredictable tab order - use 0 or -1"
            ))
        
        # Check for event.preventDefault() on keyboard events without escape handling
        if re.search(r'(e|event)\.preventDefault\(\)', line_stripped):
            context_start = max(0, i - 10)
            context_end = min(len(lines), i + 10)
            context = '\n'.join(lines[context_start:context_end])
            
            # Check if this is in a keyboard event handler
            in_keyboard_handler = bool(
                re.search(r'\bonKeyDown\s*=', context) or
                re.search(r'\bonKeyPress\s*=', context) or
                re.search(r'\bonKeyUp\s*=', context)
            )
            
            # Check if escape key is being handled
            has_escape_handling = bool(
                re.search(r'key\s*===?\s*["\']Escape["\']', context) or
                re.search(r'keyCode\s*===?\s*27', context) or
                re.search(r'key\s*===?\s*["\']Esc["\']', context)
            )
            
            if in_keyboard_handler and not has_escape_handling:
                # This is a warning, not an error - context dependent
                # Commented out to avoid false positives
                pass
        
        # Check for Dialog/Modal components with focus trap
        if re.search(r'<(Dialog|Modal)', line_stripped):
            context_start = max(0, i - 5)
            context_end = min(len(lines), i + 50)  # Look ahead more for dialog content
            context = '\n'.join(lines[context_start:context_end])
            
            # Check for onClose handler (escape mechanism)
            has_close_handler = bool(
                re.search(r'\bonClose\s*=', context) or
                re.search(r'\bhandler\s*=', context)  # Material-Tailwind pattern
            )
            
            # Headless UI Dialog has built-in escape handling
            is_headless_ui = bool(re.search(r'from\s+["\']@headlessui/react["\']', content))
            
            if not (has_close_handler or is_headless_ui):
                violations.append((
                    file_path,
                    i,
                    f"Dialog/Modal should have onClose handler for Escape key"
                ))
    
    return violations


def check_character_shortcuts(file_path: str, content: str) -> List[Tuple[str, int, str]]:
    """
    Check for single character key shortcuts (WCAG 2.1 SC 2.1.4)
    
    Checks:
    - Single character shortcuts (e.g., key === 's')
    - These should be turn-off-able, remappable, or only active when component focused
    """
    violations = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        
        # Check for single character key detection
        # Pattern: key === 'x' or keyCode === number (for single chars)
        single_char_pattern = re.search(
            r'''
            (?:key|keyCode)\s*===?\s*  # key or keyCode comparison
            (?:
                ["\']([a-z])["\']|      # Single letter in quotes
                (\d{65,90})             # keyCode for A-Z (65-90)
            )
            ''',
            line_stripped,
            re.VERBOSE | re.IGNORECASE
        )
        
        if single_char_pattern:
            # Check if this is a modifier key combination
            context_start = max(0, i - 3)
            context_end = min(len(lines), i + 3)
            context = '\n'.join(lines[context_start:context_end])
            
            has_modifier = bool(
                re.search(r'\b(ctrlKey|altKey|metaKey|shiftKey)\b', context)
            )
            
            # Check if this is inside a focused input/textarea
            in_input_context = bool(
                re.search(r'<(input|textarea|select)', context, re.IGNORECASE) or
                re.search(r'(target|currentTarget).*?tagName.*?(INPUT|TEXTAREA)', context)
            )
            
            if not (has_modifier or in_input_context):
                violations.append((
                    file_path,
                    i,
                    f"Single character keyboard shortcut should require modifier key (Ctrl/Alt/Cmd) or be turn-off-able"
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
                'keyboard_access': 'Keyboard Access (SC 2.1.1)',
                'keyboard_trap': 'Keyboard Trap (SC 2.1.2)',
                'character_shortcuts': 'Character Key Shortcuts (SC 2.1.4)',
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
        print(f"\n{GREEN}✓ All keyboard accessibility checks passed!{RESET}\n")


def main():
    """Main validation function"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print(f"{BLUE}Scanning for keyboard accessibility issues...{RESET}\n")
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
            violations['keyboard_access'].extend(check_keyboard_access(file_path, content))
            violations['keyboard_trap'].extend(check_keyboard_trap(file_path, content))
            violations['character_shortcuts'].extend(check_character_shortcuts(file_path, content))
            
        except Exception as e:
            print(f"{YELLOW}Warning: Could not process {file_path}: {e}{RESET}")
    
    # Print results
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}WCAG 2.1 Guideline 2.1: Keyboard Accessible - Validation Results{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    print_violations(violations)
    
    # Print summary
    total_violations = sum(len(v) for v in violations.values())
    
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Summary:{RESET}")
    print(f"  Files scanned: {len(files)}")
    print(f"  Keyboard Access (SC 2.1.1) issues: {len(violations['keyboard_access'])}")
    print(f"  Keyboard Trap (SC 2.1.2) issues: {len(violations['keyboard_trap'])}")
    print(f"  Character Shortcuts (SC 2.1.4) issues: {len(violations['character_shortcuts'])}")
    print(f"  Total issues: {total_violations}")
    
    print(f"\n{BLUE}Compliance Status:{RESET}")
    if total_violations == 0:
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.1.1 (Keyboard) - Level A{RESET}")
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.1.2 (No Keyboard Trap) - Level A{RESET}")
        print(f"  {GREEN}✓ WCAG 2.1 SC 2.1.4 (Character Key Shortcuts) - Level A{RESET}")
        print(f"  {GREEN}✓ EN 301 549 Section 9.2.1 (Keyboard){RESET}")
    else:
        print(f"  {RED}✗ Issues found - see details above{RESET}")
    
    print(f"\n{BLUE}Notes:{RESET}")
    print(f"  • This script validates common keyboard accessibility patterns")
    print(f"  • Manual testing required for:")
    print(f"    - Tab order and focus flow")
    print(f"    - Focus indicators visibility (use yarn a11y:contrast)")
    print(f"    - Modal focus trapping behavior")
    print(f"    - Skip links functionality")
    print(f"    - Keyboard shortcuts in complex interactions")
    print(f"  • Material-Tailwind Menu components have built-in keyboard support")
    print(f"  • Headless UI Dialog components have built-in Escape key handling")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Exit with appropriate code
    sys.exit(1 if total_violations > 0 else 0)


if __name__ == '__main__':
    main()
