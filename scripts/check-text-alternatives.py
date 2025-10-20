#!/usr/bin/env python3

"""
CENNSO Website - Text Alternatives Validator

This script validates WCAG 2.1 Success Criterion 1.1.1 (Non-text Content)
by checking that all images, icons, and interactive elements have proper
text alternatives.

Exit codes:
0 - All checks passed
1 - Text alternative violations found
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"

class Violation:
    def __init__(self, name: str, file: str, severity: str, description: str, wcag: str):
        self.name = name
        self.file = file
        self.severity = severity
        self.description = description
        self.wcag = wcag

def print_header():
    print("\n" + "=" * 85)
    print(f"{BOLD}{CYAN}🔍 CENNSO WEBSITE - TEXT ALTERNATIVES VALIDATION{RESET}")
    print("=" * 85)

def print_results(violations: List[Violation], total_files: int):
    print(f"\n{BOLD}Check                                          File                    Status{RESET}")
    print("-" * 85)
    
    passed_files = total_files - len(set(v.file for v in violations))
    
    if passed_files > 0:
        print(f"{'Files with no violations'.ljust(43)} {'N/A'.ljust(20)} {GREEN}✅ PASS{RESET}")
    
    for violation in violations:
        file_name = os.path.basename(violation.file).ljust(20)
        check_name = violation.name[:43].ljust(43)
        status_icon = f"{YELLOW}⚠️  WARN{RESET}" if violation.severity == "warning" else f"{RED}❌ FAIL{RESET}"
        print(f"{check_name} {file_name} {status_icon}")
        print(f"  {YELLOW}└─ {violation.description}{RESET}")
    
    print("=" * 85)

def check_patterns(file_path: str) -> List[Violation]:
    """Check file for text alternative violations using regex patterns."""
    violations = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"{RED}Error reading {file_path}: {e}{RESET}")
        return violations
    
    file_name = os.path.basename(file_path)
    
    # Pattern 1: Missing alt attribute on <Image> components
    if re.search(r'<Image\s+(?![^>]*\balt=)', content):
        violations.append(Violation(
            name="Missing alt attribute on Image components",
            file=file_name,
            severity="error",
            description="All <Image> components must have alt attribute",
            wcag="WCAG 2.1 SC 1.1.1"
        ))
    
    # Pattern 2: Missing alt attribute on <img> elements
    if re.search(r'<img\s+(?![^>]*\balt=)', content):
        violations.append(Violation(
            name="Missing alt attribute on img elements",
            file=file_name,
            severity="error",
            description="All <img> elements must have alt attribute",
            wcag="WCAG 2.1 SC 1.1.1"
        ))
    
    # Pattern 3: Icon-only buttons without accessible name
    button_pattern = r'<button(?![^>]*(?:aria-label=|title=|>.*[a-zA-Z]))(?=[^>]*>\s*<(?:svg|Icon|Svg))'
    if re.search(button_pattern, content, re.IGNORECASE):
        violations.append(Violation(
            name="Icon-only button without accessible name",
            file=file_name,
            severity="warning",
            description="Icon-only buttons should have aria-label, title, or visible text",
            wcag="WCAG 2.1 SC 4.1.2"
        ))
    
    # Pattern 4: Share buttons without aria-label
    share_pattern = r'<(?:Email|Facebook|Linkedin|Reddit|Twitter)ShareButton(?![^>]*aria-label)'
    if re.search(share_pattern, content):
        violations.append(Violation(
            name="Share button without aria-label",
            file=file_name,
            severity="error",
            description="Share buttons must have aria-label for screen readers",
            wcag="WCAG 2.1 SC 2.4.4"
        ))
    
    # Project-specific requirement 1: Avatar images must include author details
    if 'Avatar.tsx' in file_name:
        alt_pattern = r'alt=\{`\$\{author\.name\}.*\$\{author\.position\}.*\$\{author\.company\}`\}'
        if not re.search(alt_pattern, content):
            violations.append(Violation(
                name="Avatar images must include author details",
                file=file_name,
                severity="error",
                description="Avatar images must have alt text with author name, position, and company",
                wcag="Project requirement"
            ))
    
    # Project-specific requirement 2: MenuToggle must have dynamic aria-label
    if 'MenuT' in file_name:
        has_aria_label = 'aria-label={' in content
        has_dynamic_text = 'Open navigation menu' in content or 'Close navigation menu' in content
        if not (has_aria_label and has_dynamic_text):
            violations.append(Violation(
                name="MenuToggle must have dynamic aria-label",
                file=file_name,
                severity="error",
                description="MenuToggle must have dynamic aria-label based on open/closed state",
                wcag="Project requirement"
            ))
    
    return violations

def scan_files() -> Tuple[List[Violation], int]:
    """Scan all TypeScript component and page files."""
    violations = []
    
    # Get all .tsx files in components/ and pages/
    component_files = list(Path('components').rglob('*.tsx'))
    page_files = list(Path('pages').rglob('*.tsx'))
    all_files = component_files + page_files
    
    print(f"\n{CYAN}📂 Scanning TypeScript components...{RESET}")
    print(f"   Found {len(all_files)} files to check\n")
    
    for file_path in all_files:
        file_violations = check_patterns(str(file_path))
        violations.extend(file_violations)
    
    return violations, len(all_files)

def main():
    print_header()
    
    violations, total_files = scan_files()
    
    # Separate errors and warnings
    errors = [v for v in violations if v.severity == "error"]
    warnings = [v for v in violations if v.severity == "warning"]
    passed_files = total_files - len(set(v.file for v in violations))
    
    print_results(violations, total_files)
    
    # Print summary
    print(f"\n{BOLD}📊 RESULTS:{RESET}")
    print(f"   {GREEN}✅ Files passed: {passed_files}{RESET}")
    if errors:
        print(f"   {RED}❌ Errors found: {len(errors)}{RESET}")
    if warnings:
        print(f"   {YELLOW}⚠️  Warnings: {len(warnings)}{RESET}")
    
    if errors:
        print(f"\n{RED}{BOLD}❌ TEXT ALTERNATIVES VALIDATION FAILED{RESET}")
        print(f"\n{YELLOW}📋 Required Actions:{RESET}")
        print("   1. Add missing alt attributes to all images")
        print("   2. Add aria-label to icon-only buttons")
        print("   3. Mark decorative elements with aria-hidden=\"true\"")
        print(f"   4. See {CYAN}docs/accessibility-text-alternatives.md{RESET} for guidelines")
        print("\n" + "=" * 85)
        sys.exit(1)
    
    if warnings:
        print(f"\n{YELLOW}⚠️  PASSED WITH WARNINGS{RESET}")
        print("   Review warnings and consider fixing for better accessibility\n")
        print("=" * 85)
        sys.exit(0)
    
    print(f"\n{GREEN}{BOLD}🎉 ✅ ALL TEXT ALTERNATIVES CHECKS PASSED!{RESET}")
    print(f"\n{GREEN}✅ Compliance:{RESET}")
    print("   ✅ WCAG 2.1 SC 1.1.1 (Non-text Content)")
    print("   ✅ WCAG 2.1 SC 4.1.2 (Name, Role, Value)")
    print("   ✅ EN 301 549 Section 9.1.1.1")
    print("\n" + "=" * 85 + "\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
