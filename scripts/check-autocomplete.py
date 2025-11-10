#!/usr/bin/env python3
"""
WCAG 2.1 AA Autocomplete Validation Script

Validates that autocomplete attributes use correct values according to HTML spec.

References:
- WCAG 2.1 SC 1.3.5 (Identify Input Purpose) - Level AA
- axe rule: autocomplete-valid
- HTML spec: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

# Valid autocomplete tokens according to HTML spec
# https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
VALID_AUTOCOMPLETE_TOKENS = {
    # Contact information
    'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name',
    'honorific-suffix', 'nickname', 'username',
    'new-password', 'current-password', 'one-time-code',
    'organization-title', 'organization', 
    'street-address', 'address-line1', 'address-line2', 'address-line3',
    'address-level4', 'address-level3', 'address-level2', 'address-level1',
    'country', 'country-name', 'postal-code',
    'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name',
    'cc-number', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type',
    'transaction-currency', 'transaction-amount',
    'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex',
    'url', 'photo',
    
    # Communication
    'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local',
    'tel-local-prefix', 'tel-local-suffix', 'tel-extension',
    'email', 'impp',
    
    # Special tokens
    'on', 'off',
    
    # Section modifiers (can prefix other tokens)
    'shipping', 'billing',
    
    # Webauthn tokens
    'webauthn',
}

# Common mistakes mapping
COMMON_MISTAKES = {
    'phone': 'tel',
    'telephone': 'tel',
    'phone-number': 'tel',
    'mobile': 'tel',
    'e-mail': 'email',
    'mail': 'email',
    'zip': 'postal-code',
    'zip-code': 'postal-code',
    'zipcode': 'postal-code',
    'postcode': 'postal-code',
    'firstname': 'given-name',
    'first-name': 'given-name',
    'lastname': 'family-name',
    'last-name': 'family-name',
    'fullname': 'name',
    'full-name': 'name',
    'address': 'street-address',
    'addr': 'street-address',
    'city': 'address-level2',
    'state': 'address-level1',
    'region': 'address-level1',
    'province': 'address-level1',
}

def validate_autocomplete_value(value: str) -> Tuple[bool, str]:
    """
    Validate an autocomplete attribute value.
    
    Returns: (is_valid, suggestion)
    """
    if not value or value.strip() == '':
        return True, ''
    
    # Split by whitespace (autocomplete can have multiple tokens)
    tokens = value.strip().lower().split()
    
    # Check each token
    invalid_tokens = []
    for token in tokens:
        if token not in VALID_AUTOCOMPLETE_TOKENS:
            invalid_tokens.append(token)
    
    if invalid_tokens:
        suggestions = []
        for token in invalid_tokens:
            if token in COMMON_MISTAKES:
                suggestions.append(f"'{token}' should be '{COMMON_MISTAKES[token]}'")
        
        suggestion_text = '; '.join(suggestions) if suggestions else 'Check HTML spec for valid values'
        return False, suggestion_text
    
    return True, ''

def find_autocomplete_issues(file_path: Path) -> List[Dict]:
    """Find autocomplete attribute issues in a file."""
    issues = []
    
    try:
        content = file_path.read_text()
        lines = content.split('\n')
        
        # Pattern to match autoComplete or autocomplete attributes
        # Matches: autoComplete="value" or autocomplete="value"
        pattern = re.compile(r'auto[Cc]omplete\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
        
        for i, line in enumerate(lines, 1):
            for match in pattern.finditer(line):
                value = match.group(1)
                is_valid, suggestion = validate_autocomplete_value(value)
                
                if not is_valid:
                    issues.append({
                        'line': i,
                        'value': value,
                        'suggestion': suggestion,
                        'snippet': line.strip()[:100]
                    })
                    
    except Exception as e:
        print(f"{RED}Error reading {file_path}: {e}{RESET}")
        
    return issues

def check_autocomplete():
    """Check all TypeScript/TSX files for autocomplete issues."""
    
    print(f"\n{BLUE}{'=' * 85}{RESET}")
    print(f"{BLUE}🔍 CENNSO WEBSITE - AUTOCOMPLETE VALIDATION{RESET}")
    print(f"{BLUE}{'=' * 85}{RESET}\n")
    
    root = Path.cwd()
    
    # Find all TypeScript/TSX files
    patterns = ['**/*.tsx', '**/*.ts']
    exclude_dirs = {
        'node_modules', '.next', 'dist', 'build', '.git', 
        'coverage', '.turbo', 'scripts/generate-og-images'
    }
    
    all_files = []
    for pattern in patterns:
        for file_path in root.glob(pattern):
            if not any(excluded in file_path.parts for excluded in exclude_dirs):
                all_files.append(file_path)
    
    print(f"📂 Scanning files for autocomplete attributes...")
    print(f"   Found {len(all_files)} files to check\n")
    
    all_issues = []
    
    for file_path in all_files:
        issues = find_autocomplete_issues(file_path)
        if issues:
            all_issues.append((file_path, issues))
    
    # Print results
    print(f"\n{BLUE}{'Check':<45} {'File':<25} {'Status':<15}{RESET}")
    print(f"{BLUE}{'-' * 85}{RESET}")
    
    if not all_issues:
        print(f"{'All autocomplete attributes valid':<45} {'N/A':<25} {GREEN}✅ PASS{RESET}")
    else:
        for file_path, issues in all_issues:
            rel_path = file_path.relative_to(root)
            print(f"\n{RED}❌ {rel_path}{RESET}")
            for issue in issues:
                print(f"   Line {issue['line']}: autoComplete=\"{issue['value']}\"")
                if issue['suggestion']:
                    print(f"   {YELLOW}💡 Suggestion: {issue['suggestion']}{RESET}")
                print(f"   {YELLOW}{issue['snippet']}...{RESET}")
    
    print(f"{BLUE}{'=' * 85}{RESET}\n")
    
    # Print summary
    total_files_with_issues = len(all_issues)
    total_issues = sum(len(issues) for _, issues in all_issues)
    
    print(f"{BLUE}📊 RESULTS:{RESET}")
    print(f"   📁 Files scanned: {len(all_files)}")
    print(f"   {RED if total_issues > 0 else GREEN}⚠️  Files with issues: {total_files_with_issues}{RESET}")
    print(f"   {RED if total_issues > 0 else GREEN}⚠️  Total issues: {total_issues}{RESET}\n")
    
    if total_issues == 0:
        print(f"{GREEN}🎉 ✅ ALL AUTOCOMPLETE VALIDATION PASSED!{RESET}\n")
        print(f"{GREEN}✅ Compliance:{RESET}")
        print(f"   ✅ WCAG 2.1 SC 1.3.5 (Identify Input Purpose) - Level AA")
        print(f"   ✅ All autocomplete values follow HTML spec")
        print(f"   ✅ axe rule: autocomplete-valid\n")
        print(f"{BLUE}{'=' * 85}{RESET}\n")
        return 0
    else:
        print(f"{RED}❌ AUTOCOMPLETE VALIDATION FAILED!{RESET}\n")
        print(f"{YELLOW}🔧 Common fixes:{RESET}")
        print(f"   • 'phone' → 'tel'")
        print(f"   • 'telephone' → 'tel'")
        print(f"   • 'firstname' → 'given-name'")
        print(f"   • 'lastname' → 'family-name'")
        print(f"   • 'zip' → 'postal-code'\n")
        print(f"{YELLOW}📚 References:{RESET}")
        print(f"   • WCAG 2.1 SC 1.3.5: https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose")
        print(f"   • HTML spec: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill")
        print(f"   • axe rule: https://dequeuniversity.com/rules/axe/4.11/autocomplete-valid\n")
        print(f"{BLUE}{'=' * 85}{RESET}\n")
        return 1

if __name__ == '__main__':
    sys.exit(check_autocomplete())
