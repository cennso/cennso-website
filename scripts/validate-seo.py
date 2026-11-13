#!/usr/bin/env python3
"""
SEO Metadata Validation Script

Reads every page `next build` prerendered (.next/server/pages/*.html) and the
sitemap, and checks what search engines and link previews read about each page.

See specs/001-seo-basics/spec.md (FR-003, FR-007 to FR-010) and the constitution,
section VI.

ERRORS fail the check. They are the things that are either right or wrong:
- exactly one <title> in <head>; every page's title is "<page name> · Cennso",
  the home page's starts with "Cennso"; og:title is the page name alone
- a meta description on every page
- no two pages with the same title or the same description
- og:site_name "Cennso", og:locale "en_US", og:type, twitter:card
  "summary_large_image", one theme-color per theme, each a colour
- canonical: https://www.cennso.com plus the page's own path, the home page
  with its slash and every other page without one; og:url the same
- the 404 page: noindex, and no canonical or og:url
- the sitemap lists exactly the indexable pages, each by its canonical URL

WARNINGS are reported and do not fail the check. They are lengths, which content
sometimes needs to exceed (a success story's title, say):
- title longer than 60 characters (Google cuts the end, the site's name)
- description longer than 160 characters, or shorter than 50
"""

import re
import sys
import xml.etree.ElementTree as ElementTree
from pathlib import Path
from typing import Dict, List, Optional

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Run: pip install beautifulsoup4")
    sys.exit(1)

# ANSI color codes
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

SITE_URL = "https://www.cennso.com"
SITE_NAME = "Cennso"
TITLE_SUFFIX = f" · {SITE_NAME}"
OG_LOCALE = "en_US"
TWITTER_CARD = "summary_large_image"
THEME_SCHEMES = ("light", "dark")

TITLE_MAX = 60
DESCRIPTION_MIN = 50
DESCRIPTION_MAX = 160

PAGES_DIR = Path(".next/server/pages")
# next-sitemap writes it into public/ after the build; the standalone output
# carries a copy of public/, which is what CI restores from its build cache.
SITEMAP_CANDIDATES = (
    Path("public/sitemap.xml"),
    Path(".next/standalone/public/sitemap.xml"),
)
SITEMAP_NAMESPACE = "{http://www.sitemaps.org/schemas/sitemap/0.9}"

# A CSS colour as a theme-color carries one: hex, or a functional notation.
COLOUR = re.compile(r"^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab)\(.+\))$")


def page_path_for(html_file: Path) -> str:
    """The route a prerendered file answers: index.html is /, a/b.html is /a/b."""
    relative = html_file.relative_to(PAGES_DIR).with_suffix("")
    route = "/" + relative.as_posix()
    return "/" if route == "/index" else route


def canonical_for(page_path: str) -> str:
    """The canonical URL of a route: the home page with its slash, the rest without."""
    return f"{SITE_URL}/" if page_path == "/" else f"{SITE_URL}{page_path}"


def meta_content(soup: BeautifulSoup, **attributes: str) -> Optional[str]:
    tag = soup.find("meta", attrs=attributes)
    return tag.get("content") if tag else None


def check_page(html_file: Path) -> Dict:
    page_path = page_path_for(html_file)
    is_home = page_path == "/"
    is_not_found = page_path == "/404"
    errors: List[str] = []
    warnings: List[str] = []

    soup = BeautifulSoup(html_file.read_text(encoding="utf-8"), "html.parser")
    head = soup.head or soup

    # Title: one, in the head, in the site's pattern.
    titles = head.find_all("title", recursive=False) if soup.head else []
    title = titles[0].get_text(strip=True) if titles else None
    if len(titles) != 1:
        errors.append(f"Expected exactly one <title> in <head>, found {len(titles)}")
    og_title = meta_content(head, property="og:title")
    if title:
        if is_home:
            if not title.startswith(SITE_NAME):
                errors.append(f'Home page title must start with "{SITE_NAME}": "{title}"')
            if og_title != SITE_NAME:
                errors.append(f'Home page og:title must be "{SITE_NAME}", got "{og_title}"')
        else:
            if not title.endswith(TITLE_SUFFIX):
                errors.append(f'Title must end with "{TITLE_SUFFIX}": "{title}"')
            elif og_title != title[: -len(TITLE_SUFFIX)]:
                errors.append(
                    f'og:title must be the page name without "{TITLE_SUFFIX}": '
                    f'got "{og_title}" for title "{title}"'
                )
        if len(title) > TITLE_MAX:
            warnings.append(
                f"Title is {len(title)} chars; search results cut it after about {TITLE_MAX}"
            )

    # Description.
    description = meta_content(head, name="description")
    if not description:
        errors.append("Meta description missing")
    elif len(description) > DESCRIPTION_MAX:
        warnings.append(
            f"Description is {len(description)} chars; search results cut it after about {DESCRIPTION_MAX}"
        )
    elif len(description) < DESCRIPTION_MIN:
        warnings.append(
            f"Description is {len(description)} chars; under {DESCRIPTION_MIN} search engines often write their own"
        )

    # Site-wide tags.
    expected = {
        "og:site_name": SITE_NAME,
        "og:locale": OG_LOCALE,
    }
    for prop, value in expected.items():
        actual = meta_content(head, property=prop)
        if actual != value:
            errors.append(f'{prop} must be "{value}", got "{actual}"')
    if not meta_content(head, property="og:type"):
        errors.append("og:type missing")
    twitter_card = meta_content(head, name="twitter:card")
    if twitter_card != TWITTER_CARD:
        errors.append(f'twitter:card must be "{TWITTER_CARD}", got "{twitter_card}"')

    theme_colours = head.find_all("meta", attrs={"name": "theme-color"})
    schemes = sorted(
        (tag.get("media") or "").replace("(prefers-color-scheme:", "").strip(" )")
        for tag in theme_colours
    )
    if schemes != sorted(THEME_SCHEMES):
        errors.append(
            f"Expected one theme-color per theme {THEME_SCHEMES}, found media {schemes}"
        )
    for tag in theme_colours:
        if not COLOUR.match(tag.get("content") or ""):
            errors.append(f'theme-color is not a colour: "{tag.get("content")}"')

    # Address and indexing.
    canonical_tag = head.find("link", attrs={"rel": "canonical"})
    canonical = canonical_tag.get("href") if canonical_tag else None
    og_url = meta_content(head, property="og:url")
    robots = meta_content(head, name="robots") or ""
    noindex = "noindex" in robots

    if is_not_found:
        if not noindex:
            errors.append(f'The 404 page must be noindex, robots is "{robots}"')
        if canonical or og_url:
            errors.append("The 404 page must have no canonical or og:url")
    else:
        if noindex:
            errors.append(f'Page is noindex, robots is "{robots}"')
        expected_canonical = canonical_for(page_path)
        if canonical != expected_canonical:
            errors.append(f'Canonical must be "{expected_canonical}", got "{canonical}"')
        if og_url != canonical:
            errors.append(f'og:url must equal the canonical, got "{og_url}"')

    return {
        "path": page_path,
        "errors": errors,
        "warnings": warnings,
        "title": title,
        "description": description,
        "canonical": None if is_not_found else canonical,
    }


def read_sitemap() -> Optional[List[str]]:
    for candidate in SITEMAP_CANDIDATES:
        if candidate.exists():
            tree = ElementTree.parse(candidate)
            return [loc.text or "" for loc in tree.iter(f"{SITEMAP_NAMESPACE}loc")]
    return None


def report_duplicates(kind: str, pages: List[Dict]) -> int:
    groups: Dict[str, List[str]] = {}
    for page in pages:
        value = page[kind]
        if value:
            groups.setdefault(value, []).append(page["path"])
    duplicates = {value: paths for value, paths in groups.items() if len(paths) > 1}
    for value, paths in duplicates.items():
        preview = value[:80] + "..." if len(value) > 80 else value
        print(f'{RED}❌ DUPLICATE {kind.upper()}: "{preview}"{RESET}')
        for path in paths:
            print(f"{RED}      - {path}{RESET}")
    if duplicates:
        print()
    return len(duplicates)


def main() -> int:
    print("=" * 85)
    print(f"{BLUE}🔍 CENNSO WEBSITE - SEO METADATA VALIDATION{RESET}")
    print("=" * 85)
    print()

    if not PAGES_DIR.exists():
        print(f"{RED}❌ Error: {PAGES_DIR} directory not found{RESET}")
        print(f"{YELLOW}   Run 'yarn build' first to generate static pages{RESET}")
        return 1

    html_files = [
        html_file
        for html_file in sorted(PAGES_DIR.rglob("*.html"))
        # Next's internal pages and its generated 500 page carry no metadata of ours.
        if not html_file.name.startswith("_") and html_file.name != "500.html"
    ]
    if not html_files:
        print(f"{YELLOW}⚠️  No HTML files found in {PAGES_DIR}{RESET}")
        return 1

    print(f"{BLUE}📄 Found {len(html_files)} pages to validate{RESET}")
    print()

    pages = [check_page(html_file) for html_file in html_files]

    for page in pages:
        if not page["errors"] and not page["warnings"]:
            continue
        colour, mark = (RED, "❌") if page["errors"] else (YELLOW, "⚠️ ")
        print(f"{colour}{mark} {page['path']}{RESET}")
        for error in page["errors"]:
            print(f"{RED}   ERROR: {error}{RESET}")
        for warning in page["warnings"]:
            print(f"{YELLOW}   WARNING: {warning}{RESET}")
        if page["title"]:
            print(f"   Title: \"{page['title']}\" ({len(page['title'])} chars)")
        if page["description"]:
            preview = page["description"][:80] + ("..." if len(page["description"]) > 80 else "")
            print(f"   Description: \"{preview}\" ({len(page['description'])} chars)")
        print()

    duplicate_count = report_duplicates("title", pages) + report_duplicates(
        "description", pages
    )

    # The sitemap lists the indexable pages, each by its canonical URL, and nothing else.
    sitemap_errors: List[str] = []
    sitemap = read_sitemap()
    if sitemap is None:
        sitemap_errors.append(
            "sitemap.xml not found in public/ or .next/standalone/public/ - run 'yarn build'"
        )
    else:
        canonicals = {page["canonical"] for page in pages if page["canonical"]}
        listed = set(sitemap)
        for url in sorted(listed - canonicals):
            sitemap_errors.append(f"Sitemap lists {url}, which is no page's canonical URL")
        for url in sorted(canonicals - listed):
            sitemap_errors.append(f"Sitemap does not list {url}")
        if len(sitemap) != len(listed):
            sitemap_errors.append("Sitemap lists a URL more than once")
    for error in sitemap_errors:
        print(f"{RED}❌ SITEMAP: {error}{RESET}")
    if sitemap_errors:
        print()

    pages_with_errors = [page for page in pages if page["errors"]]
    pages_with_warnings = [page for page in pages if page["warnings"] and not page["errors"]]
    has_errors = bool(pages_with_errors or duplicate_count or sitemap_errors)

    print("=" * 85)
    print(f"{BLUE}SUMMARY:{RESET}")
    print(f"   Pages scanned: {len(pages)}")
    print(f"   Pages with errors: {len(pages_with_errors)}")
    print(f"   Pages with warnings only: {len(pages_with_warnings)}")
    print(f"   Duplicate titles/descriptions: {duplicate_count}")
    print(f"   Sitemap errors: {len(sitemap_errors)}")
    print()

    if has_errors:
        print(f"{RED}❌ SEO METADATA VALIDATION FAILED{RESET}")
    elif pages_with_warnings:
        print(f"{YELLOW}⚠️  SEO METADATA VALIDATION PASSED WITH WARNINGS{RESET}")
        print(f"{YELLOW}   Lengths are recommendations, not requirements{RESET}")
    else:
        print(f"{GREEN}🎉 ✅ ALL SEO METADATA VALIDATION PASSED!{RESET}")
    print("=" * 85)

    return 1 if has_errors else 0


if __name__ == "__main__":
    sys.exit(main())
