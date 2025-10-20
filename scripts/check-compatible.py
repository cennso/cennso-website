#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 4.1 - Compatible Validation Script

Validates key SCs related to robustness and ARIA:
- SC 4.1.2 Name, Role, Value (Level A)
- SC 4.1.3 Status Messages (Level A)

Checks performed (static heuristics):
- Detect interactive elements (role, button, link, input, select, textarea) without accessible name
- Detect elements with role attributes that may be misused or missing semantic equivalents
- Detect dynamic content/state changes without aria-live or role="status"/role="alert"

Exit: 0 if no Level A issues; 1 otherwise.
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List
from collections import defaultdict

@dataclass
class CompatibleIssue:
    file_path: Path
    line_number: int
    criterion: str
    level: str
    message: str
    code_snippet: str


def read_file_lines(file_path: Path) -> List[str]:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.readlines()
    except Exception:
        return []


def get_files() -> List[Path]:
    root = Path('.')
    patterns = ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js', '**/*.mdx']
    exclude_dirs = {'node_modules', '.next', 'out', 'dist', 'build', '.git', 'public', 'coverage'}
    files = []
    for pattern in patterns:
        for p in root.glob(pattern):
            if not any(ex in p.parts for ex in exclude_dirs):
                files.append(p)
    return sorted(set(files))


def detect_missing_name_role_value(file_path: Path, lines: List[str]) -> List[CompatibleIssue]:
    issues = []
    content = ''.join(lines)

    # Look for elements that are interactive but may lack accessible names
    # Patterns: <button ...>, <a ...>, role="button", role="link", role="tab", role="menuitem"
    # Require the tag name be followed by a space, '>' or '/' so we don't match TS/TSX generics like <Array<...>>
    interactive_pattern = re.compile(r'<(button|a|input|select|textarea)(\s|>|/)[^>]*>|role=["\'](button|link|tab|menuitem|option)["\']', re.IGNORECASE)

    # Skip primitive component wrappers (they get names at usage sites)
    if str(file_path).startswith('components/common/'):
        return []

    for m in interactive_pattern.finditer(content):
        start = m.start()
        snippet = content[start:start+200]
        line_no = content[:start].count('\n') + 1

        # If the tag contains aria-label or aria-labelledby (or the React camelCase prop ariaLabelledBy)
        # or has text content, it's fine. Also treat JSX expression children like >{...}< as visible content
        if re.search(r'aria-label=|aria-labelledby=|ariaLabelledBy=|ariaLabelledby=|>[^<]+<|>\s*\{', snippet, re.IGNORECASE):
            continue

        # For anchors, if href present and text content absent, flag
        if m.group(1) == 'a' and not re.search(r'href=["\']', snippet):
            # It's not necessarily a link
            continue

        # Special-case inputs: check if input has an associated <label> (wrapped or with for=id)
        if m.group(1) == 'input':
            # try to get id from the snippet first
            id_match = re.search(r'\bid\s*=\s*["\']([^"\']+)["\']', snippet)
            input_id = None
            if id_match:
                input_id = id_match.group(1)
            else:
                # try to find id in a slightly larger window
                larger = content[start:start+800]
                id_match = re.search(r'\bid\s*=\s*["\']([^"\']+)["\']', larger)
                if id_match:
                    input_id = id_match.group(1)

            labeled = False
            if input_id:
                # check for <label for="id"> somewhere in the file
                if re.search(rf'<label[^>]*for\s*=\s*["\']{re.escape(input_id)}["\']', content, re.IGNORECASE):
                    labeled = True

            # check for wrapping <label> that contains the input (search back and forward)
            if not labeled:
                back_start = max(0, start-500)
                back = content[back_start:start]
                next_part = content[start:start+500]
                if '<label' in back and '</label>' in next_part:
                    labeled = True

            if labeled:
                continue

        issues.append(CompatibleIssue(
            file_path=file_path,
            line_number=line_no,
            criterion='SC 4.1.2',
            level='A',
            message='Interactive element may be missing accessible name (aria-label/aria-labelledby or visible text). Ensure Name, Role, Value is exposed to assistive technologies.',
            code_snippet=snippet.strip()
        ))

    # Additional check: elements with role present should have proper attributes
    role_pattern = re.compile(r'role=["\']([^"\']+)["\']', re.IGNORECASE)
    for m in role_pattern.finditer(content):
        role = m.group(1).lower()
        start = m.start()
        line_no = content[:start].count('\n') + 1
        # warn on uncommon roles that often are misused
        if role in ('presentation', 'none'):
            # If used on semantic element with interactive children, that's suspicious but hard to detect
            continue
        if role in ('dialog', 'alertdialog'):
            # these roles require accessible name and role handling
            snippet = content[start:start+200]
            if not re.search(r'aria-label=|aria-labelledby=', snippet):
                issues.append(CompatibleIssue(
                    file_path=file_path,
                    line_number=line_no,
                    criterion='SC 4.1.2',
                    level='A',
                    message=f'Element with role="{role}" should have an accessible name (aria-label or aria-labelledby).',
                    code_snippet=snippet.strip()
                ))

    return issues


def detect_missing_status_messages(file_path: Path, lines: List[str]) -> List[CompatibleIssue]:
    issues = []
    content = ''.join(lines)

    # If file contains setState/mutation that looks like state updates or fetch results
    # we only want to flag when a status-like keyword appears near the state change to avoid false positives
    state_change_patterns = [r'set[A-Z]\w+\(', r'setState\(', r'dispatch\(', r'fetch\(']
    keywords = ['error', 'success', 'message', 'status', 'alert', 'toast']
    found_status_near_state = False
    for p in state_change_patterns:
        for m in re.finditer(p, content):
            window_start = max(0, m.start() - 200)
            window_end = min(len(content), m.end() + 200)
            window = content[window_start:window_end].lower()
            if any(re.search(r"\\b" + kw + r"\\b", window) for kw in keywords):
                found_status_near_state = True
                break
        if found_status_near_state:
            break

    if found_status_near_state:
        if not re.search(r'aria-live=|role=["\'](status|alert)["\']', content, re.IGNORECASE):
            issues.append(CompatibleIssue(
                file_path=file_path,
                line_number=1,
                criterion='SC 4.1.3',
                level='A',
                message='File contains dynamic state updates and message-like keywords near those updates but no obvious status message region (aria-live or role="status"/"alert"). Ensure status messages are programmatically exposed.',
                code_snippet='(state changes detected near message-like keywords)'
            ))

    return issues


def validate_file(file_path: Path) -> List[CompatibleIssue]:
    lines = read_file_lines(file_path)
    if not lines:
        return []

    issues = []
    content = ''.join(lines)
    # Heuristic: skip files that don't contain lowercase JSX tags (e.g. <div>, <button>)
    # This avoids false positives from TypeScript generics like <ButtonProps>
    if not re.search(r'<[a-z]', content):
        return []
    issues.extend(detect_missing_name_role_value(file_path, lines))
    issues.extend(detect_missing_status_messages(file_path, lines))
    return issues


def print_report(issues: List[CompatibleIssue], total_files: int):
    errors = [i for i in issues if i.level == 'A']
    print('\n' + '='*80)
    print('WCAG 2.1 Guideline 4.1 - Compatible Validation Report')
    print('='*80 + '\n')
    print(f'Files checked: {total_files}')
    print(f'Total issues: {len(issues)} ({len(errors)} Level A issues)\n')

    by_crit = defaultdict(list)
    for i in issues:
        by_crit[i.criterion].append(i)

    for crit, items in by_crit.items():
        print(f'{crit} ({len(items)} issues)')
        for it in items:
            print(f'  - {it.file_path}:{it.line_number} [{it.level}] {it.message}')
            snippet = it.code_snippet.replace('\n', ' ')[:160]
            print(f'    Code: {snippet}')
        print('')

    print('='*80)
    if len(errors) == 0:
        print('EN 301 549 Section 9.4.?: COMPLIANT (no Level A issues found)')
    else:
        print(f'EN 301 549 NON-COMPLIANT: {len(errors)} Level A issues found')
    print('='*80 + '\n')


def main():
    print('Checking WCAG 2.1 Guideline 4.1 (Compatible)...')
    files = get_files()
    all_issues = []
    for f in files:
        all_issues.extend(validate_file(f))

    print_report(all_issues, len(files))
    sys.exit(1 if any(i.level == 'A' for i in all_issues) else 0)

if __name__ == '__main__':
    main()
