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
- robots.txt: the Content Signals policy word for word, one `User-agent: *`
  group with a well-formed Content-Signal (search=yes, since the site is
  indexed) and `Allow: /`, no Disallow, the sitemap's address, and every
  llms*.txt it names present in the build
- icons: every page links favicon.ico, icon.svg, icon.png, the Apple icon and
  the manifest; the files exist at their sizes (the Apple icon and the logo
  opaque, the logo square and at least 112 px, as Google requires); the
  manifest parses, names the site, and every icon it lists exists at its size
- agents: every page carries the sentence for agents (pointing at llms.txt)
  and <link rel="describedby" href="/llms.txt">, and has its markdown
  (/<page>.md, /index.md for the home page) opening with the same sentence;
  llms.txt has the llmstxt.org shape (one H1, a > summary, only
  `- [name](url): description` lines under its H2s) under 50 000 characters,
  links every page's markdown, and every address of this site in it exists in
  the build; no "undefined" in any of these files

WARNINGS are reported and do not fail the check. They are lengths, which content
sometimes needs to exceed (a success story's title, say):
- title longer than 60 characters (Google cuts the end, the site's name)
- description longer than 160 characters, or shorter than 50
"""

import json
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

# public/robots.txt is in git; llms.txt and llms-full.txt are generated into
# public/ before the build, and CI has only the standalone copy.
PUBLIC_DIRS = (Path("public"), Path(".next/standalone/public"))

# Cloudflare's Content Signals Policy, released under CC0 for any robots.txt
# (https://blog.cloudflare.com/content-signals-policy/). It must stay word for
# word: a crawler that honours Content-Signal reads the line against these
# definitions, and the last paragraph is what makes a "no" an express
# reservation of rights under Article 4 of EU Directive 2019/790.
CONTENT_SIGNALS_POLICY = """# As a condition of accessing this website, you agree to
# abide by the following content signals:

# (a)  If a content-signal = yes, you may collect content
# for the corresponding use.
# (b)  If a content-signal = no, you may not collect content
# for the corresponding use.
# (c)  If the website operator does not include a content
# signal for a corresponding use, the website operator
# neither grants nor restricts permission via content signal
# with respect to the corresponding use.

# The content signals and their meanings are:

# search: building a search index and providing search
# results (e.g., returning hyperlinks and short excerpts
# from your website's contents).  Search does not include
# providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models
# (e.g., retrieval augmented generation, grounding, or other
# real-time taking of content for generative AI search
# answers).
# ai-train: training or fine-tuning AI models.

# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS
# RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN
# UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED RIGHTS
# IN THE DIGITAL SINGLE MARKET.
"""
# What every page's <head> links: (rel, href). scripts/generate-icons draws the files.
ICON_LINKS = (
    ("icon", "/favicon.ico"),
    ("icon", "/icon.svg"),
    ("icon", "/icon.png"),
    ("apple-touch-icon", "/apple-touch-icon.png"),
    ("manifest", "/manifest.webmanifest"),
)
# Square PNGs under public/: size, and whether they must be opaque (iOS paints
# transparency black; Google wants a logo that looks right on white).
ICON_FILES = {
    "icon.png": (192, False),
    "apple-touch-icon.png": (180, True),
    "icons/icon-512.png": (512, False),
    "icons/maskable-512.png": (512, True),
    "assets/logo.png": (512, True),
}
FAVICON_SIZES = {(16, 16), (32, 32), (48, 48)}
LOGO_MIN = 112

LLMS_MAX = 50_000
LLMS_ENTRY = re.compile(r"^- \[[^\]]+\]\((https://[^)\s]+)\)(: .+)?$")

CONTENT_SIGNAL = re.compile(
    r"^search=(yes|no), ai-input=(yes|no), ai-train=(yes|no)$"
)

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

    # The way to llms.txt for an agent reading the HTML (components/Layout.tsx).
    sentence = soup.find(attrs={"data-agent-directive": True})
    if sentence is None or sentence.find("a", href="/llms.txt") is None:
        errors.append("the sentence for agents, linking /llms.txt, is missing")
    if ("describedby", "/llms.txt") not in {
        (" ".join(link.get("rel", [])), link.get("href"))
        for link in head.find_all("link")
    }:
        errors.append('<link rel="describedby" href="/llms.txt"> missing')

    # Icons, the same on every page (pages/_document.tsx).
    linked = {
        (" ".join(link.get("rel", [])), link.get("href"))
        for link in head.find_all("link")
    }
    for rel, href in ICON_LINKS:
        if (rel, href) not in linked:
            errors.append(f'<link rel="{rel}" href="{href}"> missing')

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


def find_public(name: str) -> Optional[Path]:
    for directory in PUBLIC_DIRS:
        candidate = directory / name
        if candidate.exists():
            return candidate
    return None


def check_robots() -> List[str]:
    """What robots.txt says: see the module docstring."""
    robots = find_public("robots.txt")
    if robots is None:
        return ["robots.txt not found in public/"]
    text = robots.read_text(encoding="utf-8")
    errors: List[str] = []

    if not text.startswith(CONTENT_SIGNALS_POLICY):
        errors.append(
            "robots.txt must start with the Content Signals policy, word for word"
        )

    directives = [
        line.split(":", 1)
        for line in text.splitlines()
        if line.strip() and not line.startswith("#") and ":" in line
    ]
    fields = [(name.strip().lower(), value.strip()) for name, value in directives]

    agents = [value for name, value in fields if name == "user-agent"]
    if agents != ["*"]:
        errors.append(f"robots.txt must have one group, User-agent: *, found {agents}")

    signals = [value for name, value in fields if name == "content-signal"]
    if len(signals) != 1 or not CONTENT_SIGNAL.match(signals[0]):
        errors.append(
            "robots.txt needs one Content-Signal: search=yes|no, ai-input=yes|no, "
            f"ai-train=yes|no, found {signals}"
        )
    elif not signals[0].startswith("search=yes"):
        errors.append("robots.txt allows crawling, so Content-Signal must say search=yes")

    if ("allow", "/") not in fields:
        errors.append("robots.txt must say Allow: /")
    disallowed = [value for name, value in fields if name == "disallow"]
    if disallowed:
        errors.append(f"robots.txt must disallow nothing, found {disallowed}")

    sitemaps = [value for name, value in fields if name == "sitemap"]
    if sitemaps != [f"{SITE_URL}/sitemap.xml"]:
        errors.append(f"robots.txt must name {SITE_URL}/sitemap.xml, found {sitemaps}")

    for name in re.findall(rf"{re.escape(SITE_URL)}/(llms[\w-]*\.txt)", text):
        if find_public(name) is None:
            errors.append(f"robots.txt names {SITE_URL}/{name}, which the build does not have")

    return errors


def markdown_path(page_path: str) -> str:
    """A page's markdown file under public/: index.md for the home page."""
    return "index.md" if page_path == "/" else f"{page_path.lstrip('/')}.md"


def check_agents(page_paths: List[str]) -> List[str]:
    """llms.txt and every page's markdown: see the module docstring."""
    errors: List[str] = []

    for page_path in page_paths:
        markdown = find_public(markdown_path(page_path))
        if markdown is None:
            errors.append(f"{page_path} has no markdown ({markdown_path(page_path)})")
            continue
        text = markdown.read_text(encoding="utf-8")
        if not text.startswith("> For AI agents"):
            errors.append(f"{markdown_path(page_path)} must open with the sentence for agents")
        if "undefined" in text:
            errors.append(f'{markdown_path(page_path)} contains "undefined"')

    llms_path = find_public("llms.txt")
    if llms_path is None:
        return errors + ["llms.txt not found - run 'yarn build'"]
    llms = llms_path.read_text(encoding="utf-8")
    lines = llms.splitlines()

    if len(llms) > LLMS_MAX:
        errors.append(f"llms.txt is {len(llms)} characters; keep it under {LLMS_MAX}")
    if not lines or not lines[0].startswith("# ") or sum(l.startswith("# ") for l in lines) != 1:
        errors.append("llms.txt must open with its one H1")
    if not any(line.startswith("> ") for line in lines[:4]):
        errors.append("llms.txt needs a > summary under its H1")
    if "undefined" in llms:
        errors.append('llms.txt contains "undefined"')

    linked = set()
    in_section = False
    for line in lines:
        if line.startswith("## "):
            in_section = True
            continue
        if not in_section or not line.strip():
            continue
        match = LLMS_ENTRY.match(line)
        if match is None:
            errors.append(f"llms.txt line under a section is not a link entry: {line[:80]}")
            continue
        url = match.group(1)
        if url.startswith(f"{SITE_URL}/"):
            linked.add(url)
            if find_public(url[len(SITE_URL) + 1 :]) is None:
                errors.append(f"llms.txt links {url}, which the build does not have")

    for page_path in page_paths:
        url = f"{SITE_URL}/{markdown_path(page_path)}"
        if url not in linked:
            errors.append(f"llms.txt does not link {url}")

    full = find_public("llms-full.txt")
    if full is None:
        errors.append("llms-full.txt not found - run 'yarn build'")
    elif "undefined" in full.read_text(encoding="utf-8"):
        errors.append('llms-full.txt contains "undefined"')

    return errors


def check_icons() -> List[str]:
    """The icon files and the manifest: see the module docstring."""
    try:
        from PIL import Image
    except ImportError:
        return ["Pillow is required to check the icons: pip install Pillow"]

    errors: List[str] = []

    def opened(name: str):
        path = find_public(name)
        if path is None:
            errors.append(f"{name} not found in public/ - run 'yarn generate:icons'")
            return None
        return Image.open(path)

    favicon = opened("favicon.ico")
    if favicon is not None:
        sizes = set(favicon.info.get("sizes", set()))
        if sizes != FAVICON_SIZES:
            errors.append(f"favicon.ico carries {sorted(sizes)}, expected {sorted(FAVICON_SIZES)}")

    svg = find_public("icon.svg")
    if svg is None or "<svg" not in svg.read_text(encoding="utf-8"):
        errors.append("icon.svg missing or not an SVG")

    for name, (size, opaque) in ICON_FILES.items():
        image = opened(name)
        if image is None:
            continue
        if image.format != "PNG" or image.size != (size, size):
            errors.append(f"{name} is {image.format} {image.size}, expected PNG {size}×{size}")
        transparent = "A" in image.getbands() or "transparency" in image.info
        if opaque and transparent:
            errors.append(f"{name} must be opaque")
    logo = opened("assets/logo.png")
    if logo is not None and (logo.size[0] != logo.size[1] or logo.size[0] < LOGO_MIN):
        errors.append(f"assets/logo.png must be square and at least {LOGO_MIN} px")

    manifest_path = find_public("manifest.webmanifest")
    if manifest_path is None:
        errors.append("manifest.webmanifest not found in public/")
        return errors
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return errors + [f"manifest.webmanifest is not JSON: {error}"]
    if manifest.get("name") != SITE_NAME or manifest.get("start_url") != "/":
        errors.append(f'manifest must name "{SITE_NAME}" and start at /')
    icons = manifest.get("icons") or []
    if not any(icon.get("purpose") == "maskable" for icon in icons):
        errors.append("manifest lists no maskable icon")
    for icon in icons:
        name = str(icon.get("src", "")).lstrip("/")
        image = opened(name)
        if image is not None and f"{image.size[0]}x{image.size[1]}" != icon.get("sizes"):
            errors.append(f"manifest says {name} is {icon.get('sizes')}, it is {image.size}")

    return errors


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

    icon_errors = check_icons()

    agent_errors = check_agents(
        [page["path"] for page in pages if page["canonical"]]
    )
    for error in agent_errors:
        print(f"{RED}❌ AGENTS: {error}{RESET}")
    if agent_errors:
        print()
    for error in icon_errors:
        print(f"{RED}❌ ICONS: {error}{RESET}")
    if icon_errors:
        print()

    robots_errors = check_robots()
    for error in robots_errors:
        print(f"{RED}❌ ROBOTS: {error}{RESET}")
    if robots_errors:
        print()

    pages_with_errors = [page for page in pages if page["errors"]]
    pages_with_warnings = [page for page in pages if page["warnings"] and not page["errors"]]
    has_errors = bool(
        pages_with_errors
        or duplicate_count
        or sitemap_errors
        or robots_errors
        or icon_errors
        or agent_errors
    )

    print("=" * 85)
    print(f"{BLUE}SUMMARY:{RESET}")
    print(f"   Pages scanned: {len(pages)}")
    print(f"   Pages with errors: {len(pages_with_errors)}")
    print(f"   Pages with warnings only: {len(pages_with_warnings)}")
    print(f"   Duplicate titles/descriptions: {duplicate_count}")
    print(f"   Sitemap errors: {len(sitemap_errors)}")
    print(f"   robots.txt errors: {len(robots_errors)}")
    print(f"   Icon errors: {len(icon_errors)}")
    print(f"   Agent file errors: {len(agent_errors)}")
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
