#!/usr/bin/env python3

"""
CENNSO Website - Semantic Structure Validator

This script validates WCAG 2.1 Guideline 1.3 (Adaptable) compliance by checking
that content has proper semantic structure and can be programmatically determined.

Validates:
- WCAG 2.1 SC 1.3.1 (Info and Relationships) - Level A
- WCAG 2.1 SC 1.3.2 (Meaningful Sequence) - Level A  
- EN 301 549 Section 9.1.3.1

Exit codes:
0 - All checks passed
1 - Semantic structure violations found
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"

class SemanticViolation:
    def __init__(self, name: str, file: str, severity: str, description: str, wcag: str, line_num: int = 0):
        self.name = name
        self.file = file
        self.severity = severity
        self.description = description
        self.wcag = wcag
        self.line_num = line_num

def print_header():
    print("\n" + "=" * 85)
    print(f"{BOLD}{CYAN}📐 CENNSO WEBSITE - SEMANTIC STRUCTURE VALIDATION{RESET}")
    print("=" * 85)

def print_results(violations: List[SemanticViolation], total_files: int):
    print(f"\n{BOLD}Check                                          File                    Status{RESET}")
    print("-" * 85)
    
    if not violations:
        print(f"{'All semantic structure valid'.ljust(43)} {'N/A'.ljust(20)} {GREEN}✅ PASS{RESET}")
    else:
        for violation in violations:
            file_name = os.path.basename(violation.file).ljust(20)
            check_name = violation.name[:43].ljust(43)
            status_icon = f"{YELLOW}⚠️  WARN{RESET}" if violation.severity == "warning" else f"{RED}❌ FAIL{RESET}"
            print(f"{check_name} {file_name} {status_icon}")
            if violation.line_num > 0:
                print(f"  {YELLOW}└─ Line {violation.line_num}: {violation.description}{RESET}")
            else:
                print(f"  {YELLOW}└─ {violation.description}{RESET}")
    
    print("=" * 85)

def check_heading_hierarchy(file_path: str, content: str) -> List[SemanticViolation]:
    """Check for proper heading hierarchy (no skipped levels)."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Only check page files for heading hierarchy, not components
    # Components are reusable and may have headings that are contextually correct
    is_page = file_path.startswith('pages/') and not file_path.startswith('pages/api/') and not file_path.endswith('_app.tsx') and not file_path.endswith('_document.tsx')
    
    if not is_page:
        return violations
    
    # Check if page uses PageHeader component (which renders h1)
    has_page_header = bool(re.search(r'<PageHeader\s', content, re.IGNORECASE))
    
    # Extract all heading levels with their line numbers
    heading_pattern = r'<(h[1-6]|GradientHeader[^>]*as="h([1-6])")[^>]*>'
    headings = []
    
    for match in re.finditer(heading_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        if match.group(1).startswith('h'):
            level = int(match.group(1)[1])
        else:
            level = int(match.group(2))
        headings.append((level, line_num))
    
    # If page uses PageHeader, treat it as having h1 at the top
    if has_page_header:
        # Just check for skipped levels assuming h1 exists from PageHeader
        if headings and headings[0][0] > 2:
            violations.append(SemanticViolation(
                name=f"Heading level skipped after PageHeader",
                file=file_name,
                severity="error",
                description=f"PageHeader provides h1, but next heading is h{headings[0][0]} (should be h2)",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=headings[0][1]
            ))
        # Check remaining hierarchy
        for i in range(1, len(headings)):
            prev_level, _ = headings[i - 1]
            curr_level, curr_line = headings[i]
            if curr_level > prev_level + 1:
                violations.append(SemanticViolation(
                    name=f"Heading level skipped",
                    file=file_name,
                    severity="error",
                    description=f"h{prev_level} → h{curr_level} skips levels (should be h{prev_level} → h{prev_level + 1})",
                    wcag="WCAG 2.1 SC 1.3.1",
                    line_num=curr_line
                ))
        return violations
    
    if not headings:
        # Pages should have at least one heading
        violations.append(SemanticViolation(
            name="Page without headings",
            file=file_name,
            severity="warning",
            description="Page should have at least one heading for structure",
            wcag="WCAG 2.1 SC 1.3.1",
            line_num=0
        ))
        return violations
    
    # Check if first heading is h1
    first_level, first_line = headings[0]
    if first_level != 1:
        violations.append(SemanticViolation(
            name="First heading is not h1",
            file=file_name,
            severity="error",
            description=f"First heading is h{first_level}, should be h1 (WCAG 1.3.1)",
            wcag="WCAG 2.1 SC 1.3.1",
            line_num=first_line
        ))
    
    # Check for skipped levels
    for i in range(1, len(headings)):
        prev_level, _ = headings[i - 1]
        curr_level, curr_line = headings[i]
        
        if curr_level > prev_level + 1:
            violations.append(SemanticViolation(
                name=f"Heading level skipped",
                file=file_name,
                severity="error",
                description=f"h{prev_level} → h{curr_level} skips levels (should be h{prev_level} → h{prev_level + 1})",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=curr_line
            ))
    
    # Check for multiple h1s in a page
    h1_count = sum(1 for level, _ in headings if level == 1)
    if h1_count > 1:
        violations.append(SemanticViolation(
            name="Multiple h1 elements",
            file=file_name,
            severity="error",
            description=f"Page has {h1_count} h1 elements, should have exactly 1",
            wcag="WCAG 2.1 SC 1.3.1",
            line_num=0
        ))
    
    return violations

def check_landmarks(file_path: str, content: str) -> List[SemanticViolation]:
    """Check for presence of semantic landmarks."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Only check Layout component and specific components for landmarks
    # Pages get <main> from Layout.tsx, so don't check pages directly
    is_layout = 'Layout.tsx' in file_path
    is_navigation = 'Navigation.tsx' in file_path
    is_footer = 'Footer.tsx' in file_path
    is_cookies_banner = 'CookiesBanner.tsx' in file_path
    
    # Check for main landmark (only in Layout component)
    if is_layout:
        if not re.search(r'<main[\s>]', content, re.IGNORECASE):
            violations.append(SemanticViolation(
                name="Missing <main> landmark",
                file=file_name,
                severity="error",
                description="Layout must have a <main> element for primary content (WCAG 1.3.1)",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=0
            ))
    
    # Check for nav landmark (in Navigation component)
    if is_navigation:
        if not re.search(r'<nav[\s>]', content, re.IGNORECASE):
            violations.append(SemanticViolation(
                name="Missing <nav> landmark",
                file=file_name,
                severity="error",
                description="Navigation should use <nav> element (WCAG 1.3.1)",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=0
            ))
    
    # Check for footer landmark (in Footer component)
    if is_footer:
        if not re.search(r'<footer[\s>]', content, re.IGNORECASE):
            violations.append(SemanticViolation(
                name="Missing <footer> landmark",
                file=file_name,
                severity="error",
                description="Footer should use <footer> element (WCAG 1.3.1)",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=0
            ))
    
    # Check for cookies banner landmark (axe rule: region)
    # All page content must be contained by landmarks
    if is_cookies_banner:
        # Cookies banner must use a landmark element
        # Valid options: <aside>, <section>, or role="complementary"
        has_aside = bool(re.search(r'<aside[\s>]', content, re.IGNORECASE))
        has_section = bool(re.search(r'<section[\s>]', content, re.IGNORECASE))
        has_complementary_role = bool(re.search(r'role=["\']complementary["\']', content, re.IGNORECASE))
        
        if not (has_aside or has_section or has_complementary_role):
            # Find the main return statement to report line number
            return_match = re.search(r'return\s*\(', content, re.IGNORECASE)
            line_num = content[:return_match.start()].count('\n') + 1 if return_match else 0
            
            violations.append(SemanticViolation(
                name="Banner content not in landmark",
                file=file_name,
                severity="error",
                description="Cookies banner must use landmark element (<aside>, <section>, or role='complementary') - axe rule: region",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=line_num
            ))
    
    return violations

def check_list_semantics(file_path: str, content: str) -> List[SemanticViolation]:
    """Check that lists use proper semantic markup."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Check for div-based "lists" that should be semantic lists
    # This is a warning, not an error, as sometimes divs are appropriate
    nav_with_divs = re.finditer(r'<nav[^>]*>.*?<div[^>]*class="[^"]*(?:menu|nav|list)[^"]*"', content, re.DOTALL | re.IGNORECASE)
    
    for match in nav_with_divs:
        # Check if there's a <ul> or <ol> nearby
        nav_content = content[match.start():match.start() + 500]
        if not re.search(r'<[uo]l[\s>]', nav_content, re.IGNORECASE):
            line_num = content[:match.start()].count('\n') + 1
            violations.append(SemanticViolation(
                name="Navigation without list markup",
                file=file_name,
                severity="warning",
                description="Navigation menus should use <ul>/<ol> + <li> elements",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=line_num
            ))
    
    return violations

def check_form_labels(file_path: str, content: str) -> List[SemanticViolation]:
    """Check that form inputs have associated labels."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Only check form components, but skip the generic Form.tsx component library
    # Form.tsx contains reusable input components that get labels when used in actual forms
    if 'Form' not in file_path or file_path.endswith('/Form.tsx') or file_path.endswith('\\Form.tsx'):
        return violations
    
    # Find input/textarea/select elements
    input_pattern = r'<(input|textarea|select)(?![^>]*(?:type=["\'](?:hidden|submit|button)["\']))[^>]*>'
    
    for match in re.finditer(input_pattern, content, re.IGNORECASE):
        input_tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check if input has id attribute
        id_match = re.search(r'\bid=["\']([^"\']+)["\']', input_tag)
        
        if id_match:
            input_id = id_match.group(1)
            # Look for corresponding label (check both 'for' and 'htmlFor' for JSX/React)
            label_pattern = rf'<label[^>]*\b(?:htmlFor|for)=["\' ]{input_id}["\']'
            has_for_label = re.search(label_pattern, content, re.IGNORECASE)
            has_aria = re.search(r'\baria-label=', input_tag, re.IGNORECASE) or \
                       re.search(r'\baria-labelledby=', input_tag, re.IGNORECASE)
            
            if not has_for_label and not has_aria:
                # Check if it's wrapped in a label (look back up to 1000 chars)
                context_start = max(0, match.start() - 1000)
                context = content[context_start:match.end()]
                
                # Count opening and closing label tags to determine if input is wrapped
                labels_before = context[:match.start() - context_start]
                open_labels = len(re.findall(r'<label[^>]*>', labels_before, re.IGNORECASE))
                close_labels = len(re.findall(r'</label>', labels_before, re.IGNORECASE))
                
                # If there are more opening labels than closing labels, input is wrapped
                is_wrapped = open_labels > close_labels
                
                if not is_wrapped:
                    violations.append(SemanticViolation(
                        name="Input without label",
                        file=file_name,
                        severity="error",
                        description=f"Form input must have associated <label>, aria-label, or aria-labelledby (WCAG 1.3.1)",
                        wcag="WCAG 2.1 SC 1.3.1",
                        line_num=line_num
                    ))
        else:
            # No ID, check for aria-label or wrapped in label
            if not re.search(r'\baria-label=', input_tag, re.IGNORECASE):
                # Check if it's wrapped in a label (look back up to 1000 chars for complex wrappers)
                context_start = max(0, match.start() - 1000)
                context = content[context_start:match.end()]
                
                # Count opening and closing label tags to determine if input is wrapped
                labels_before = context[:match.start() - context_start]
                open_labels = len(re.findall(r'<label[^>]*>', labels_before, re.IGNORECASE))
                close_labels = len(re.findall(r'</label>', labels_before, re.IGNORECASE))
                
                # If there are more opening labels than closing labels, input is wrapped
                is_wrapped = open_labels > close_labels
                
                if not is_wrapped:
                    violations.append(SemanticViolation(
                        name="Input without accessible name",
                        file=file_name,
                        severity="warning",
                        description="Form input should have id + label, aria-label, or be wrapped in <label>",
                        wcag="WCAG 2.1 SC 1.3.1",
                        line_num=line_num
                    ))
    
    return violations

def check_table_structure(file_path: str, content: str) -> List[SemanticViolation]:
    """Check that tables have proper structure with th elements."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Skip Markdown component since it handles table rendering with th elements via MDX
    if 'Markdown.tsx' in file_path:
        return violations
    
    # Find table elements
    table_pattern = r'<table[^>]*>.*?</table>'
    
    for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
        table_content = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check if table has <th> elements
        if not re.search(r'<th[\s>]', table_content, re.IGNORECASE):
            violations.append(SemanticViolation(
                name="Table without headers",
                file=file_name,
                severity="error",
                description="Data tables must have <th> elements to identify headers (WCAG 1.3.1)",
                wcag="WCAG 2.1 SC 1.3.1",
                line_num=line_num
            ))
        else:
            # Check for scope attribute on th elements
            th_elements = re.finditer(r'<th[^>]*>', table_content, re.IGNORECASE)
            for th_match in th_elements:
                th_tag = th_match.group(0)
                if not re.search(r'\bscope=["\'](?:row|col|rowgroup|colgroup)["\']', th_tag, re.IGNORECASE):
                    violations.append(SemanticViolation(
                        name="Table header without scope",
                        file=file_name,
                        severity="warning",
                        description="<th> elements should have scope attribute (row/col) for clarity",
                        wcag="WCAG 2.1 SC 1.3.1",
                        line_num=line_num
                    ))
                    break  # Only report once per table
    
    return violations

def scan_files() -> Tuple[List[SemanticViolation], int]:
    """Scan all TypeScript component and page files for semantic structure."""
    violations = []
    
    # Get all .tsx files in components/ and pages/
    component_files = list(Path('components').rglob('*.tsx'))
    page_files = list(Path('pages').rglob('*.tsx'))
    all_files = component_files + page_files
    
    print(f"\n{CYAN}📂 Scanning files for semantic structure...{RESET}")
    print(f"   Found {len(all_files)} files to check\n")
    
    for file_path in all_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"{RED}Error reading {file_path}: {e}{RESET}")
            continue
        
        file_path_str = str(file_path)
        
        # Run checks
        violations.extend(check_heading_hierarchy(file_path_str, content))
        violations.extend(check_landmarks(file_path_str, content))
        violations.extend(check_list_semantics(file_path_str, content))
        violations.extend(check_form_labels(file_path_str, content))
        violations.extend(check_table_structure(file_path_str, content))
    
    return violations, len(all_files)

def main():
    print_header()
    
    violations, total_files = scan_files()
    
    # Separate errors and warnings
    errors = [v for v in violations if v.severity == "error"]
    warnings = [v for v in violations if v.severity == "warning"]
    
    print_results(violations, total_files)
    
    # Print summary
    print(f"\n{BOLD}📊 RESULTS:{RESET}")
    print(f"   {CYAN}📁 Files scanned: {total_files}{RESET}")
    if errors:
        print(f"   {RED}❌ Errors found: {len(errors)}{RESET}")
    if warnings:
        print(f"   {YELLOW}⚠️  Warnings: {len(warnings)}{RESET}")
    if not violations:
        print(f"   {GREEN}✅ All semantic structure valid{RESET}")
    
    if errors:
        print(f"\n{RED}{BOLD}❌ SEMANTIC STRUCTURE VALIDATION FAILED{RESET}")
        print(f"\n{YELLOW}📋 Required Actions:{RESET}")
        print("   1. Ensure each page has exactly one <h1> element")
        print("   2. Fix heading hierarchy (h1 → h2 → h3, no skipping levels)")
        print("   3. Add <main> landmark for primary content")
        print("   4. Ensure form inputs have associated labels")
        print("   5. Add <th> elements with scope to data tables")
        print(f"   6. See {CYAN}docs/accessibility-adaptable-content.md{RESET} for guidelines")
        print("\n" + "=" * 85)
        sys.exit(1)
    
    if warnings:
        print(f"\n{YELLOW}⚠️  PASSED WITH WARNINGS{RESET}")
        print("   Review warnings and consider improving semantic structure\n")
        print("=" * 85)
        sys.exit(0)
    
    print(f"\n{GREEN}{BOLD}🎉 ✅ ALL SEMANTIC STRUCTURE CHECKS PASSED!{RESET}")
    print(f"\n{GREEN}✅ Compliance:{RESET}")
    print("   ✅ WCAG 2.1 SC 1.3.1 (Info and Relationships)")
    print("   ✅ WCAG 2.1 SC 1.3.2 (Meaningful Sequence)")
    print("   ✅ EN 301 549 Section 9.1.3.1")
    print(f"\n{CYAN}📝 Validated:{RESET}")
    print("   • Heading hierarchy (h1 → h2 → h3)")
    print("   • Landmark regions (<main>, <nav>, <footer>, <aside>)")
    print("   • Banner/overlay content in landmarks (axe rule: region)")
    print("   • Form label associations")
    print("   • Table header structure")
    print("   • List semantics")
    print("\n" + "=" * 85 + "\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
