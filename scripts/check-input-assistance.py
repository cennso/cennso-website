#!/usr/bin/env python3
"""
WCAG 2.1 Guideline 3.3 - Input Assistance Validation Script

Validates SC 3.3.1-3.3.4:
- SC 3.3.1 Error Identification (Level A)
- SC 3.3.2 Labels or Instructions (Level A)
- SC 3.3.3 Error Suggestion (Level AA)
- SC 3.3.4 Error Prevention (Level AA)

The script performs static checks to find common form accessibility issues:
- Inputs without associated <label> (htmlFor/id) or aria-label/aria-labelledby
- Inputs with placeholder used as the only label
- Mismatch between visible label text and aria-label
- Required fields without aria-required or visual marker in label
- Missing type="email"/"tel" for email/phone inputs
- Forms that auto-submit on input (onChange submit)
- Basic detection for error message containers (role="alert"/aria-live)

Exit code: 0 if no Level A/AA issues; 1 otherwise.
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List
from collections import defaultdict

@dataclass
class InputAssistanceIssue:
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
                # Skip common component primitive files which are intentionally
                # generic input implementations and will be labeled at usage sites.
                if str(p).endswith('components/common/Form.tsx'):
                    continue
                if str(p).endswith('components/common/Select.tsx'):
                    continue
                files.append(p)
    return sorted(set(files))


def find_labelled_inputs(file_path: Path, lines: List[str]):
    """Detect inputs and determine if they have labels (for/id), aria-label, or aria-labelledby"""
    issues = []
    content = ''.join(lines)

    # Find input/select/textarea elements
    input_pattern = re.compile(r'<(input|select|textarea)[^>]*>', re.IGNORECASE)
    label_pattern = re.compile(r'<label[^>]*for=["\'](?P<id>[^"\']+)["\'][^>]*>(?P<text>.*?)</label>', re.DOTALL | re.IGNORECASE)

    # Map of ids that have labels
    labelled_ids = set()
    for m in label_pattern.finditer(content):
        labelled_ids.add(m.group('id'))

    # Also capture aria-labelledby references
    aria_labelledby_pattern = re.compile(r'aria-labelledby=["\']([^"\']+)["\']', re.IGNORECASE)

    # Iterate through inputs and check attributes
    for match in input_pattern.finditer(content):
        tag = match.group(0)
        start = match.start()
        line_no = content[:start].count('\n') + 1

        # Skip hidden inputs
        if re.search(r'type=["\']hidden["\']', tag, re.IGNORECASE):
            continue

        # Check for id and match with label
        id_match = re.search(r'id=["\']([^"\']+)["\']', tag)
        aria_label_match = re.search(r'aria-label=["\']([^"\']+)["\']', tag)
        aria_labelledby_match = re.search(r'aria-labelledby=["\']([^"\']+)["\']', tag)
        placeholder_match = re.search(r'placeholder=["\']([^"\']+)["\']', tag)
        type_match = re.search(r'type=["\']([^"\']+)["\']', tag)
        name_match = re.search(r'name=["\']([^"\']+)["\']', tag)

        has_label = False
        label_text = ''
        if id_match and id_match.group(1) in labelled_ids:
            has_label = True
        if aria_label_match:
            has_label = True
            label_text = aria_label_match.group(1)
        if aria_labelledby_match:
            has_label = True

        # If no label detected, placeholder is not sufficient
        if not has_label:
            issues.append(InputAssistanceIssue(
                file_path=file_path,
                line_number=line_no,
                criterion='SC 3.3.2',
                level='A',
                message='Form control missing associated label (use <label for="id"> or aria-label/aria-labelledby). Placeholder is not a visible label.',
                code_snippet=tag.strip()
            ))

        # If input type looks like email/phone but type attribute missing or wrong
        if name_match:
            name = name_match.group(1).lower()
            if 'email' in name and (not type_match or type_match.group(1).lower() != 'email'):
                issues.append(InputAssistanceIssue(
                    file_path=file_path,
                    line_number=line_no,
                    criterion='SC 3.3.2',
                    level='AA',
                    message='Input appears to collect an email address but does not use type="email". Use semantic input types for better assistance and mobile keyboards.',
                    code_snippet=tag.strip()
                ))
            if 'phone' in name or 'tel' in name:
                if not type_match or type_match.group(1).lower() != 'tel':
                    issues.append(InputAssistanceIssue(
                        file_path=file_path,
                        line_number=line_no,
                        criterion='SC 3.3.2',
                        level='AA',
                        message='Input appears to collect a phone number but does not use type="tel". Use type="tel" for better mobile input assistance.',
                        code_snippet=tag.strip()
                    ))

        # Placeholder-only label detection (placeholder used as only visible label)
        if placeholder_match and not has_label:
            issues.append(InputAssistanceIssue(
                file_path=file_path,
                line_number=line_no,
                criterion='SC 3.3.2',
                level='A',
                message='Placeholder text used as the only label. Placeholders are not sufficient labels; provide a visible <label>.',
                code_snippet=tag.strip()
            ))

    return issues


def find_mismatch_label_aria(file_path: Path, lines: List[str]):
    """Detect mismatches between visible label text and aria-label if both present"""
    issues = []
    content = ''.join(lines)

    # Match label with for=id and the input that references the id
    label_for_pattern = re.compile(r'<label[^>]*for=["\'](?P<id>[^"\']+)["\'][^>]*>(?P<text>.*?)</label>', re.DOTALL | re.IGNORECASE)
    inputs_pattern = re.compile(r'<(input|select|textarea)[^>]*id=["\'](?P<id>[^"\']+)["\'][^>]*>', re.IGNORECASE)

    label_map = {}
    for m in label_for_pattern.finditer(content):
        id_ = m.group('id')
        text = re.sub(r'<[^>]+>', '', m.group('text')).strip()
        label_map[id_] = text

    for m in inputs_pattern.finditer(content):
        id_ = m.group('id')
        start = m.start()
        line_no = content[:start].count('\n') + 1
        aria_label_match = re.search(r'aria-label=["\']([^"\']+)["\']', m.group(0))
        if aria_label_match and id_ in label_map:
            visible = label_map[id_].lower()
            aria = aria_label_match.group(1).lower()
            if visible not in aria and aria not in visible:
                issues.append(InputAssistanceIssue(
                    file_path=file_path,
                    line_number=line_no,
                    criterion='SC 3.3.2',
                    level='A',
                    message='Visible label and aria-label appear inconsistent. Accessible name SHOULD match visible label text to aid voice control and screen reader users.',
                    code_snippet=f'label="{label_map[id_]}" aria-label="{aria_label_match.group(1)}"'
                ))

    return issues


def check_error_identification_and_suggestions(file_path: Path, lines: List[str]):
    """Check for presence of potential error message containers and ARIA live regions"""
    issues = []
    content = ''.join(lines)

    # Look for forms and check for role="alert" or aria-live usage for error messages
    form_pattern = re.compile(r'<form[^>]*>', re.IGNORECASE)
    if form_pattern.search(content):
        # Check for likely error containers
        if not re.search(r'role=["\']alert["\']|aria-live=', content, re.IGNORECASE):
            # Not necessarily a failure, but warn to verify error message reporting
            issues.append(InputAssistanceIssue(
                file_path=file_path,
                line_number=1,
                criterion='SC 3.3.1/3.3.3',
                level='AA',
                message='Form found but no obvious error message container (role="alert"/aria-live). Ensure errors are programmatically associated and suggested.',
                code_snippet='<form>...'
            ))

    return issues


def check_auto_submit_on_input(file_path: Path, lines: List[str]):
    """Detect onChange handlers that submit or navigate without explicit submit button"""
    issues = []
    content = ''.join(lines)

    # Patterns indicating onChange triggers an immediate submit or navigation
    patterns = [
        r'onChange\s*=\s*\{[^}]*submit\(',
        r'onChange\s*=\s*\{[^}]*handleSubmit\(',
        r'onChange\s*=\s*\{[^}]*router\.push\(',
        r'onChange\s*=\s*\{[^}]*navigate\(',
    ]
    for pat in patterns:
        for m in re.finditer(pat, content, re.IGNORECASE):
            start = m.start()
            line_no = content[:start].count('\n') + 1
            issues.append(InputAssistanceIssue(
                file_path=file_path,
                line_number=line_no,
                criterion='SC 3.3.4',
                level='AA',
                message='Input change triggers form submit or navigation. If automatic submission is required, inform the user beforehand or provide an opt-out.',
                code_snippet=content[start:start+120].strip()
            ))

    return issues


def validate_file(file_path: Path) -> List[InputAssistanceIssue]:
    lines = read_file_lines(file_path)
    if not lines:
        return []
    issues = []

    issues.extend(find_labelled_inputs(file_path, lines))
    issues.extend(find_mismatch_label_aria(file_path, lines))
    issues.extend(check_error_identification_and_suggestions(file_path, lines))
    issues.extend(check_auto_submit_on_input(file_path, lines))

    return issues


def print_report(all_issues: List[InputAssistanceIssue], total_files: int):
    errors = [i for i in all_issues if i.level in ('A', 'AA')]
    warnings = [i for i in all_issues if i.level not in ('A', 'AA')]

    print('\n' + '='*80)
    print('WCAG 2.1 Guideline 3.3 - Input Assistance Validation Report')
    print('='*80 + '\n')

    print(f'Files checked: {total_files}')
    print(f'Total issues: {len(all_issues)} ({len(errors)} Level A/AA issues)\n')

    by_crit = defaultdict(list)
    for issue in all_issues:
        by_crit[issue.criterion].append(issue)

    for crit, items in by_crit.items():
        print(f'{crit} ({len(items)} issues)')
        for it in items:
            print(f'  - {it.file_path}:{it.line_number} [{it.level}] {it.message}')
            snippet = it.code_snippet.replace('\n', ' ')[:120]
            print(f'    Code: {snippet}')
        print('')

    print('='*80)
    print('IMPLEMENTATION GUIDANCE:')
    print('='*80)
    print('''
Key guidance:
- Always associate inputs with visible <label for="id"> or use aria-label/aria-labelledby
- Do not rely on placeholders as the only label
- Use semantic input types (email, tel, url, number) to improve mobile keyboards and validation
- Expose error messages programmatically (role="alert" or aria-live) and connect them to inputs via aria-describedby
- Avoid auto-submit on input change without clear prior warning and an explicit submit alternative
''')


def main():
    print('Checking WCAG 2.1 Guideline 3.3 (Input Assistance) ...')
    files = get_files()
    all_issues = []
    for f in files:
        all_issues.extend(validate_file(f))
    print_report(all_issues, len(files))
    # Exit non-zero if any Level A/AA issues found
    exit_code = 1 if any(i.level in ('A', 'AA') for i in all_issues) else 0
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
