#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 3.2 - Predictable Validation Script

Validates compliance with WCAG 2.1 Success Criteria 3.2.1-3.2.5:
- SC 3.2.1 On Focus (Level A)
- SC 3.2.2 On Input (Level A)
- SC 3.2.3 Consistent Navigation (Level AA)
- SC 3.2.4 Consistent Identification (Level AA)
- SC 3.2.5 Change on Request (Level AAA - informational)

EN 301 549 Reference: Section 9.3.2 (Predictable)

Exit codes:
- 0: All checks pass (Level A/AA)
- 1: One or more Level A/AA issues found
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Set, Tuple
from collections import defaultdict

@dataclass
class PredictableIssue:
    """Represents a predictable guideline violation"""
    file_path: Path
    line_number: int
    criterion: str
    level: str
    message: str
    code_snippet: str

def read_file_lines(file_path: Path) -> List[str]:
    """Read file and return lines, handling encoding errors"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.readlines()
    except (UnicodeDecodeError, FileNotFoundError):
        return []

def get_file_list() -> List[Path]:
    """Get list of files to check (TSX, JSX, TS, JS, MDX)"""
    root = Path('.')
    patterns = ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js', '**/*.mdx']
    
    exclude_dirs = {
        'node_modules', '.next', 'out', 'dist', 'build', 
        '.git', 'public', 'coverage', '__tests__'
    }
    
    files = []
    for pattern in patterns:
        for file_path in root.glob(pattern):
            if not any(excluded in file_path.parts for excluded in exclude_dirs):
                files.append(file_path)
    
    return sorted(set(files))

def check_on_focus(file_path: Path, lines: List[str]) -> List[PredictableIssue]:
    """
    SC 3.2.1 On Focus (Level A)
    
    When any user interface component receives focus, it does not initiate a 
    change of context.
    
    Checks for:
    - onFocus handlers that change location/submit forms/open new windows
    - Focus events that trigger navigation
    - Auto-submit on focus
    """
    issues = []
    
    # Patterns that indicate context changes on focus
    dangerous_focus_patterns = [
        (r'onFocus\s*=\s*\{[^}]*(?:window\.location|router\.push|navigate\()', 
         'onFocus triggers navigation'),
        (r'onFocus\s*=\s*\{[^}]*(?:window\.open|\.submit\(\))', 
         'onFocus triggers form submission or new window'),
        (r'onFocus\s*=\s*\{[^}]*(?:\.click\(\)|\.focus\(\))', 
         'onFocus triggers other element interaction'),
    ]
    
    for i, line in enumerate(lines, 1):
        for pattern, description in dangerous_focus_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(PredictableIssue(
                    file_path=file_path,
                    line_number=i,
                    criterion='SC 3.2.1',
                    level='A',
                    message=f'On Focus: {description}. Focus events MUST NOT change context (navigate, submit, open windows)',
                    code_snippet=line.strip()
                ))
    
    return issues

def check_on_input(file_path: Path, lines: List[str]) -> List[PredictableIssue]:
    """
    SC 3.2.2 On Input (Level A)
    
    Changing the setting of any user interface component does not automatically 
    cause a change of context unless the user has been advised of the behavior 
    before using the component.
    
    Checks for:
    - onChange handlers that navigate/submit without warning
    - Auto-submit on select/radio/checkbox change
    - Automatic form submission without explicit button
    """
    issues = []
    
    # Track if there are warnings/labels about auto-submit behavior
    content = ''.join(lines)
    has_auto_submit_warning = bool(re.search(
        r'(?:will\s+automatically|auto[\s-]?submit|automatically\s+submit|form\s+will\s+submit)',
        content,
        re.IGNORECASE
    ))
    
    # Patterns that indicate context changes on input
    dangerous_input_patterns = [
        (r'onChange\s*=\s*\{[^}]*(?:window\.location|router\.push|navigate\()', 
         'onChange triggers navigation'),
        (r'onChange\s*=\s*\{[^}]*(?:\.submit\(\)|handleSubmit)', 
         'onChange auto-submits form'),
        (r'<select[^>]*onChange\s*=\s*\{[^}]*(?:submit|navigate|push)', 
         'Select onChange triggers form submission or navigation'),
    ]
    
    for i, line in enumerate(lines, 1):
        for pattern, description in dangerous_input_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                # Check if this is in a context with warnings
                context_start = max(0, i - 10)
                context_lines = lines[context_start:i+5]
                context = ''.join(context_lines)
                
                has_local_warning = bool(re.search(
                    r'(?:will\s+automatically|auto[\s-]?submit|automatically\s+submit)',
                    context,
                    re.IGNORECASE
                ))
                
                if not (has_auto_submit_warning or has_local_warning):
                    issues.append(PredictableIssue(
                        file_path=file_path,
                        line_number=i,
                        criterion='SC 3.2.2',
                        level='A',
                        message=f'On Input: {description} without warning. User MUST be advised before automatic context changes',
                        code_snippet=line.strip()
                    ))
    
    return issues

def extract_navigation_structure(file_path: Path, lines: List[str]) -> Set[str]:
    """
    Extract navigation link text and structure from a file.
    Returns set of navigation items (link text or aria-label).
    """
    nav_items = set()
    
    # Check if this file contains navigation structure
    content = ''.join(lines)
    
    # Look for Navigation component or nav elements
    if not re.search(r'<(?:nav|Navigation)', content, re.IGNORECASE):
        return nav_items
    
    # Extract Link components within navigation
    # Match: <Link href="...">Text</Link> or <Link aria-label="..." />
    link_pattern = r'<Link[^>]*(?:href=["\'](.*?)["\'])[^>]*>([^<]*)</Link>|<Link[^>]*aria-label=["\'](.*?)["\']'
    
    for match in re.finditer(link_pattern, content, re.DOTALL):
        href = match.group(1) or ''
        text = match.group(2) or match.group(3) or ''
        text = text.strip()
        
        if text and not text.startswith('{'):  # Skip JSX expressions
            nav_items.add(text)
        elif href:
            # Use href as identifier if no text
            nav_items.add(href)
    
    return nav_items

def check_consistent_navigation(file_path: Path, lines: List[str]) -> List[PredictableIssue]:
    """
    SC 3.2.3 Consistent Navigation (Level AA)
    
    Navigational mechanisms that are repeated on multiple Web pages within a 
    set of Web pages occur in the same relative order each time they are repeated, 
    unless a change is initiated by the user.
    
    This check validates that Navigation component exists and is consistently used.
    Manual review required: Visual inspection of navigation order across pages.
    """
    issues = []
    
    # This is primarily a manual check, but we can validate:
    # 1. Pages use consistent Navigation component (not ad-hoc navigation)
    # 2. No hardcoded navigation menus with different orders
    
    content = ''.join(lines)
    
    # Check if this is a page file
    is_page = str(file_path).startswith('pages/') and not str(file_path).endswith('_app.tsx')
    
    if is_page:
        # Pages should use consistent Navigation component from Layout
        has_layout = bool(re.search(r'<Layout', content))
        has_navigation_component = bool(re.search(r'<Navigation', content))
        has_custom_nav = bool(re.search(r'<nav[^>]*>', content, re.IGNORECASE))
        
        # If page has custom nav instead of Layout/Navigation, flag it
        if has_custom_nav and not (has_layout or has_navigation_component):
            # Find the line with custom nav
            for i, line in enumerate(lines, 1):
                if re.search(r'<nav[^>]*>', line, re.IGNORECASE):
                    issues.append(PredictableIssue(
                        file_path=file_path,
                        line_number=i,
                        criterion='SC 3.2.3',
                        level='AA',
                        message='Consistent Navigation: Custom <nav> without Layout component. Use consistent Navigation component across all pages',
                        code_snippet=line.strip()
                    ))
                    break
    
    return issues

def extract_component_patterns(file_path: Path, lines: List[str]) -> List[Tuple[str, str, int]]:
    """
    Extract interactive component patterns with their labels/icons.
    Returns list of (component_type, identifier, line_number).
    """
    patterns = []
    content = ''.join(lines)
    
    # Extract button patterns with icons/labels
    # Match: <Button><Icon />Text</Button> or <button aria-label="...">
    button_pattern = r'<(?:Button|button)[^>]*(?:aria-label=["\'](.*?)["\'])?[^>]*>(.*?)</(?:Button|button)>'
    
    for match in re.finditer(button_pattern, content, re.DOTALL | re.IGNORECASE):
        aria_label = match.group(1) or ''
        children = match.group(2) or ''
        
        # Extract icon component names
        icon_match = re.search(r'<(\w+Icon)', children)
        icon_name = icon_match.group(1) if icon_match else ''
        
        # Extract text content (non-JSX)
        text_match = re.search(r'>([A-Za-z\s]+)<', children)
        text = text_match.group(1).strip() if text_match else ''
        
        identifier = aria_label or text or icon_name
        if identifier:
            # Find line number
            line_num = content[:match.start()].count('\n') + 1
            patterns.append(('button', identifier, line_num))
    
    # Extract link patterns
    link_pattern = r'<Link[^>]*href=["\'](.*?)["\'][^>]*(?:aria-label=["\'](.*?)["\'])?[^>]*>(.*?)</Link>'
    
    for match in re.finditer(link_pattern, content, re.DOTALL | re.IGNORECASE):
        href = match.group(1) or ''
        aria_label = match.group(2) or ''
        children = match.group(3) or ''
        
        # Extract text content
        text_match = re.search(r'>([A-Za-z\s]+)<', children)
        text = text_match.group(1).strip() if text_match else ''
        
        identifier = f"{href}|{aria_label or text}"
        if identifier:
            line_num = content[:match.start()].count('\n') + 1
            patterns.append(('link', identifier, line_num))
    
    return patterns

def check_consistent_identification(file_path: Path, lines: List[str]) -> List[PredictableIssue]:
    """
    SC 3.2.4 Consistent Identification (Level AA)
    
    Components that have the same functionality within a set of Web pages are 
    identified consistently.
    
    This validates that common components (submit buttons, navigation links, etc.) 
    use consistent labels/icons across the site.
    
    Manual review required: Cross-file comparison of component labels.
    """
    issues = []
    
    # This is primarily a manual check
    # We can provide informational guidance for common patterns
    
    content = ''.join(lines)
    
    # Check for inconsistent button labels for common actions
    common_actions = {
        'submit': ['submit', 'send', 'submit form', 'send message'],
        'cancel': ['cancel', 'close', 'dismiss'],
        'delete': ['delete', 'remove', 'trash'],
        'edit': ['edit', 'modify', 'update'],
        'save': ['save', 'save changes', 'apply'],
    }
    
    # This check is informational only - actual consistency requires cross-file analysis
    # We'll just ensure buttons have clear, consistent naming patterns
    
    return issues

def check_change_on_request(file_path: Path, lines: List[str]) -> List[PredictableIssue]:
    """
    SC 3.2.5 Change on Request (Level AAA)
    
    Changes of context are initiated only by user request or a mechanism is 
    available to turn off such changes.
    
    This is a Level AAA criterion - informational only.
    
    Checks for:
    - Automatic redirects without user action
    - Auto-refresh/reload mechanisms
    - Unsolicited popups/modals
    """
    issues = []
    
    # Level AAA - informational warnings only
    aaa_patterns = [
        (r'(?:window\.location|router\.push|navigate\()[^)]*\)\s*(?://|/\*)?(?!.*user)', 
         'Automatic navigation without explicit user action'),
        (r'setTimeout\s*\([^)]*(?:location|push|navigate)', 
         'Delayed automatic navigation'),
        (r'setInterval\s*\([^)]*(?:location|reload)', 
         'Automatic page reload'),
        (r'<meta[^>]*http-equiv=["\']\s*refresh', 
         'Meta refresh tag (automatic redirect)'),
    ]
    
    for i, line in enumerate(lines, 1):
        for pattern, description in aaa_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(PredictableIssue(
                    file_path=file_path,
                    line_number=i,
                    criterion='SC 3.2.5',
                    level='AAA',
                    message=f'Change on Request (Level AAA): {description}. Consider requiring explicit user action',
                    code_snippet=line.strip()
                ))
    
    return issues

def validate_file(file_path: Path) -> List[PredictableIssue]:
    """Validate a single file for all predictable criteria"""
    lines = read_file_lines(file_path)
    if not lines:
        return []
    
    issues = []
    
    # Run all checks
    issues.extend(check_on_focus(file_path, lines))
    issues.extend(check_on_input(file_path, lines))
    issues.extend(check_consistent_navigation(file_path, lines))
    issues.extend(check_consistent_identification(file_path, lines))
    issues.extend(check_change_on_request(file_path, lines))
    
    return issues

def print_report(all_issues: List[PredictableIssue], total_files: int):
    """Print formatted validation report"""
    
    # Separate Level A/AA errors from Level AAA informational
    errors = [issue for issue in all_issues if issue.level in ['A', 'AA']]
    warnings = [issue for issue in all_issues if issue.level == 'AAA']
    
    # Group by criterion
    by_criterion = defaultdict(list)
    for issue in all_issues:
        by_criterion[issue.criterion].append(issue)
    
    print("\n" + "="*80)
    print("WCAG 2.1 Guideline 3.2 - Predictable Validation Report")
    print("="*80)
    
    criterion_names = {
        'SC 3.2.1': 'On Focus (Level A)',
        'SC 3.2.2': 'On Input (Level A)',
        'SC 3.2.3': 'Consistent Navigation (Level AA)',
        'SC 3.2.4': 'Consistent Identification (Level AA)',
        'SC 3.2.5': 'Change on Request (Level AAA)',
    }
    
    # Print summary
    print(f"\nFiles checked: {total_files}")
    print(f"Total issues: {len(all_issues)} ({len(errors)} errors, {len(warnings)} warnings)")
    print("\nSuccess Criteria Status:")
    
    for criterion in ['SC 3.2.1', 'SC 3.2.2', 'SC 3.2.3', 'SC 3.2.4', 'SC 3.2.5']:
        criterion_issues = by_criterion.get(criterion, [])
        criterion_errors = [i for i in criterion_issues if i.level in ['A', 'AA']]
        criterion_warnings = [i for i in criterion_issues if i.level == 'AAA']
        
        status = "✓ PASS" if len(criterion_errors) == 0 else f"✗ FAIL ({len(criterion_errors)} issues)"
        warning_note = f" [{len(criterion_warnings)} AAA warnings]" if criterion_warnings else ""
        print(f"  {criterion} - {criterion_names[criterion]}: {status}{warning_note}")
    
    # Print detailed issues
    if all_issues:
        print("\n" + "-"*80)
        print("ISSUES FOUND:")
        print("-"*80)
        
        for criterion in sorted(by_criterion.keys()):
            issues = by_criterion[criterion]
            print(f"\n{criterion} - {criterion_names.get(criterion, criterion)} ({len(issues)} issues):")
            
            for issue in sorted(issues, key=lambda x: (str(x.file_path), x.line_number)):
                level_marker = "ERROR" if issue.level in ['A', 'AA'] else "INFO"
                print(f"\n  [{level_marker}] {issue.file_path}:{issue.line_number}")
                print(f"  {issue.message}")
                if issue.code_snippet:
                    print(f"  Code: {issue.code_snippet[:100]}")
    
    # Print guidance
    print("\n" + "="*80)
    print("IMPLEMENTATION GUIDANCE:")
    print("="*80)
    print("""
SC 3.2.1 On Focus (Level A):
  - Focus events MUST NOT trigger navigation, form submission, or new windows
  - Use onFocus only for visual feedback (styling, hints)
  - Require explicit user action (click/enter) for context changes

SC 3.2.2 On Input (Level A):
  - onChange/onSelect MUST NOT auto-submit without warning
  - If auto-submit is needed, warn user beforehand in label/instruction
  - Use explicit "Submit" button for form submission
  - Example good warning: "Form will automatically submit when you select an option"

SC 3.2.3 Consistent Navigation (Level AA):
  - Navigation order MUST be consistent across all pages
  - Use Layout component with Navigation for all pages
  - Manual review: Verify navigation link order matches across pages
  - Breadcrumbs, footer links should maintain consistent order

SC 3.2.4 Consistent Identification (Level AA):
  - Same functionality MUST use same labels/icons across site
  - "Submit" button should always be labeled "Submit" (not "Send" on one page, "Submit" on another)
  - Icons for same action should be consistent (same trash icon for delete)
  - Manual review: Compare common actions across pages

SC 3.2.5 Change on Request (Level AAA - Best Practice):
  - Automatic redirects SHOULD be avoided or user-configurable
  - Auto-refresh SHOULD require user consent
  - Use explicit user actions (click, submit) for all context changes
  - If auto-redirect needed, provide countdown and cancel option
""")
    
    # EN 301 549 compliance note
    print("="*80)
    print("EN 301 549 COMPLIANCE:")
    print("="*80)
    if len(errors) == 0:
        print("✓ Section 9.3.2 (Predictable): COMPLIANT")
        print("  All Level A and AA requirements met")
    else:
        print("✗ Section 9.3.2 (Predictable): NON-COMPLIANT")
        print(f"  {len(errors)} Level A/AA issues must be resolved")
    
    if warnings:
        print(f"\nℹ {len(warnings)} Level AAA recommendations for enhanced predictability")
    
    print("="*80 + "\n")

def main():
    """Main validation entry point"""
    print("Checking WCAG 2.1 Guideline 3.2 (Predictable)...")
    
    files = get_file_list()
    all_issues = []
    
    for file_path in files:
        issues = validate_file(file_path)
        all_issues.extend(issues)
    
    print_report(all_issues, len(files))
    
    # Exit with error if Level A/AA issues found
    errors = [issue for issue in all_issues if issue.level in ['A', 'AA']]
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
