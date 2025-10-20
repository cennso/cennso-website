#!/usr/bin/env python3

"""
CENNSO Website - Time-based Media Validator

This script validates WCAG 2.1 Guideline 1.2 (Time-based Media) compliance
by checking that all audio and video content has proper captions, transcripts,
and audio descriptions.

Exit codes:
0 - All checks passed (or no media found)
1 - Media accessibility violations found
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

class MediaViolation:
    def __init__(self, name: str, file: str, severity: str, description: str, wcag: str, line_num: int = 0):
        self.name = name
        self.file = file
        self.severity = severity
        self.description = description
        self.wcag = wcag
        self.line_num = line_num

def print_header():
    print("\n" + "=" * 85)
    print(f"{BOLD}{CYAN}🎬 CENNSO WEBSITE - TIME-BASED MEDIA VALIDATION{RESET}")
    print("=" * 85)

def print_results(violations: List[MediaViolation], total_files: int, has_media: bool):
    print(f"\n{BOLD}Check                                          File                    Status{RESET}")
    print("-" * 85)
    
    if not has_media:
        print(f"{'No audio/video content found'.ljust(43)} {'N/A'.ljust(20)} {GREEN}✅ PASS{RESET}")
        print(f"{YELLOW}   (Validation will run when media is added){RESET}")
    elif not violations:
        print(f"{'All media has proper accessibility'.ljust(43)} {'N/A'.ljust(20)} {GREEN}✅ PASS{RESET}")
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

def check_video_element(file_path: str, content: str) -> List[MediaViolation]:
    """Check <video> elements for required accessibility features."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Find all <video> tags
    video_pattern = r'<video[^>]*>.*?</video>'
    videos = re.finditer(video_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in videos:
        video_tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check for captions track (WCAG 1.2.2 Level A - REQUIRED)
        if not re.search(r'<track[^>]*kind=["\']captions["\']', video_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="Video without captions",
                file=file_name,
                severity="error",
                description="Videos MUST have <track kind='captions'> for WCAG 1.2.2 Level A",
                wcag="WCAG 2.1 SC 1.2.2",
                line_num=line_num
            ))
        
        # Check for audio descriptions track (WCAG 1.2.5 Level AA - REQUIRED)
        if not re.search(r'<track[^>]*kind=["\']descriptions["\']', video_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="Video without audio descriptions",
                file=file_name,
                severity="error",
                description="Videos MUST have <track kind='descriptions'> for WCAG 1.2.5 Level AA",
                wcag="WCAG 2.1 SC 1.2.5",
                line_num=line_num
            ))
        
        # Check for controls attribute
        if not re.search(r'\bcontrols\b', video_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="Video without controls",
                file=file_name,
                severity="error",
                description="Videos MUST have 'controls' attribute for keyboard accessibility",
                wcag="WCAG 2.1 SC 2.1.1",
                line_num=line_num
            ))
        
        # Check for autoplay with sound (WCAG 2.2.2 Level A)
        if re.search(r'\bautoPlay\b', video_tag, re.IGNORECASE):
            if not re.search(r'\bmuted\b', video_tag, re.IGNORECASE):
                violations.append(MediaViolation(
                    name="Video auto-plays with sound",
                    file=file_name,
                    severity="error",
                    description="Auto-playing videos MUST be muted (WCAG 2.2.2)",
                    wcag="WCAG 2.1 SC 2.2.2",
                    line_num=line_num
                ))
    
    return violations

def check_audio_element(file_path: str, content: str) -> List[MediaViolation]:
    """Check <audio> elements for required accessibility features."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Find all <audio> tags
    audio_pattern = r'<audio[^>]*>.*?</audio>'
    audios = re.finditer(audio_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in audios:
        audio_tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check for controls attribute
        if not re.search(r'\bcontrols\b', audio_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="Audio without controls",
                file=file_name,
                severity="error",
                description="Audio MUST have 'controls' attribute for keyboard accessibility",
                wcag="WCAG 2.1 SC 2.1.1",
                line_num=line_num
            ))
        
        # Check for autoplay (should be avoided)
        if re.search(r'\bautoPlay\b', audio_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="Audio auto-plays",
                file=file_name,
                severity="error",
                description="Audio MUST NOT auto-play (WCAG 2.2.2)",
                wcag="WCAG 2.1 SC 2.2.2",
                line_num=line_num
            ))
    
    # Check for transcript link near audio element (WCAG 1.2.1 Level A)
    if audios:
        # Look for transcript links within 500 characters of audio tag
        for match in re.finditer(audio_pattern, content, re.DOTALL | re.IGNORECASE):
            start = max(0, match.start() - 500)
            end = min(len(content), match.end() + 500)
            context = content[start:end]
            
            if not re.search(r'transcript', context, re.IGNORECASE):
                line_num = content[:match.start()].count('\n') + 1
                violations.append(MediaViolation(
                    name="Audio without transcript link",
                    file=file_name,
                    severity="warning",
                    description="Audio should have a link to transcript nearby (WCAG 1.2.1)",
                    wcag="WCAG 2.1 SC 1.2.1",
                    line_num=line_num
                ))
    
    return violations

def check_iframe_embeds(file_path: str, content: str) -> List[MediaViolation]:
    """Check <iframe> embeds (YouTube, Vimeo) for accessibility."""
    violations = []
    file_name = os.path.basename(file_path)
    
    # Find YouTube/Vimeo iframes
    iframe_pattern = r'<iframe[^>]*(?:youtube|vimeo)[^>]*>.*?</iframe>'
    iframes = re.finditer(iframe_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in iframes:
        iframe_tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Check for title attribute
        if not re.search(r'\btitle=', iframe_tag, re.IGNORECASE):
            violations.append(MediaViolation(
                name="iframe without title",
                file=file_name,
                severity="error",
                description="<iframe> MUST have 'title' attribute for screen readers",
                wcag="WCAG 2.1 SC 4.1.2",
                line_num=line_num
            ))
        
        # Check for aria-label or description nearby
        start = max(0, match.start() - 200)
        end = min(len(content), match.end() + 200)
        context = content[start:end]
        
        if not re.search(r'aria-label|video[-\s]description', context, re.IGNORECASE):
            violations.append(MediaViolation(
                name="iframe without description",
                file=file_name,
                severity="warning",
                description="Embedded video should have descriptive text or aria-label",
                wcag="Best practice",
                line_num=line_num
            ))
        
        # Check for YouTube captions enabled
        if 'youtube' in iframe_tag.lower():
            if not re.search(r'cc_load_policy=1', iframe_tag):
                violations.append(MediaViolation(
                    name="YouTube without captions enabled",
                    file=file_name,
                    severity="warning",
                    description="YouTube embeds should include ?cc_load_policy=1 to enable captions",
                    wcag="Best practice",
                    line_num=line_num
                ))
    
    return violations

def check_transcript_files(content_dir: str = "content") -> List[MediaViolation]:
    """Check if transcript files exist in expected locations."""
    violations = []
    
    # This is a placeholder - will be implemented when transcripts are added
    # For now, we just check if /public/transcripts directory exists
    transcript_dir = Path("public/transcripts")
    
    if not transcript_dir.exists():
        # Not a violation yet - just informational
        pass
    
    return violations

def scan_files() -> Tuple[List[MediaViolation], int, bool]:
    """Scan all TypeScript component and page files for media elements."""
    violations = []
    has_media = False
    
    # Get all .tsx files in components/ and pages/
    component_files = list(Path('components').rglob('*.tsx'))
    page_files = list(Path('pages').rglob('*.tsx'))
    mdx_files = list(Path('content').rglob('*.mdx')) if Path('content').exists() else []
    all_files = component_files + page_files + mdx_files
    
    print(f"\n{CYAN}📂 Scanning files for audio/video content...{RESET}")
    print(f"   Found {len(all_files)} files to check\n")
    
    for file_path in all_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"{RED}Error reading {file_path}: {e}{RESET}")
            continue
        
        # Check for media elements
        has_video = bool(re.search(r'<video', content, re.IGNORECASE))
        has_audio = bool(re.search(r'<audio', content, re.IGNORECASE))
        has_iframe = bool(re.search(r'<iframe[^>]*(?:youtube|vimeo)', content, re.IGNORECASE))
        
        if has_video or has_audio or has_iframe:
            has_media = True
        
        # Run checks
        violations.extend(check_video_element(str(file_path), content))
        violations.extend(check_audio_element(str(file_path), content))
        violations.extend(check_iframe_embeds(str(file_path), content))
    
    return violations, len(all_files), has_media

def main():
    print_header()
    
    violations, total_files, has_media = scan_files()
    
    # Separate errors and warnings
    errors = [v for v in violations if v.severity == "error"]
    warnings = [v for v in violations if v.severity == "warning"]
    
    print_results(violations, total_files, has_media)
    
    # Print summary
    print(f"\n{BOLD}📊 RESULTS:{RESET}")
    if not has_media:
        print(f"   {GREEN}✅ No audio/video content found{RESET}")
        print(f"   {CYAN}ℹ️  This script will validate media when it's added{RESET}")
    else:
        print(f"   {CYAN}📹 Media files found: Yes{RESET}")
        if errors:
            print(f"   {RED}❌ Errors found: {len(errors)}{RESET}")
        if warnings:
            print(f"   {YELLOW}⚠️  Warnings: {len(warnings)}{RESET}")
        if not violations:
            print(f"   {GREEN}✅ All media properly accessible{RESET}")
    
    if errors:
        print(f"\n{RED}{BOLD}❌ TIME-BASED MEDIA VALIDATION FAILED{RESET}")
        print(f"\n{YELLOW}📋 Required Actions:{RESET}")
        print("   1. Add <track kind='captions'> to all videos")
        print("   2. Add <track kind='descriptions'> to all videos (Level AA)")
        print("   3. Ensure all media has keyboard-accessible controls")
        print("   4. Remove auto-play from audio elements")
        print("   5. Provide transcript links for audio-only content")
        print(f"   6. See {CYAN}docs/accessibility-time-based-media.md{RESET} for guidelines")
        print("\n" + "=" * 85)
        sys.exit(1)
    
    if warnings:
        print(f"\n{YELLOW}⚠️  PASSED WITH WARNINGS{RESET}")
        print("   Review warnings and consider improving media accessibility\n")
        print("=" * 85)
        sys.exit(0)
    
    print(f"\n{GREEN}{BOLD}🎉 ✅ ALL TIME-BASED MEDIA CHECKS PASSED!{RESET}")
    if has_media:
        print(f"\n{GREEN}✅ Compliance:{RESET}")
        print("   ✅ WCAG 2.1 SC 1.2.1 (Audio-only and Video-only)")
        print("   ✅ WCAG 2.1 SC 1.2.2 (Captions - Level A)")
        print("   ✅ WCAG 2.1 SC 1.2.5 (Audio Description - Level AA)")
        print("   ✅ WCAG 2.1 SC 2.2.2 (Pause, Stop, Hide)")
        print("   ✅ EN 301 549 Section 9.1.2")
    else:
        print(f"\n{CYAN}📝 Ready for future media:{RESET}")
        print("   • Validation rules configured")
        print("   • Guidelines documented")
        print("   • Will automatically check when media is added")
    print("\n" + "=" * 85 + "\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
