#!/usr/bin/env python3
"""
Structured Data Validation Script

Reads the JSON-LD of every page `next build` prerendered
(.next/server/pages/*.html) and checks it against what the site says about
itself. See specs/002-zero-click-structured-data/spec.md and the constitution,
section VI.

Every rule is an ERROR:
- every block is valid JSON with @context https://schema.org, as one node or
  as a @graph; every @type is one this site uses
- every indexable page carries the Organization, @id
  https://www.cennso.com/#organization (other sites name it as their publisher,
  so it never changes), with its name, legal name, home page, a logo that
  exists in the build, description, slogan, address, contact and profiles; and
  the WebSite, @id https://www.cennso.com/#website, published by it
- every {"@id": ...} reference resolves to a node of the same page
- a BreadcrumbList has at least two crumbs, numbered from 1, each an address on
  the site, the last being the page itself; at most one per page
- a success story carries its Article, the contact page its ContactPage, each
  at the page's own canonical address
- the 404 page carries no structured data
- what disabled pages may bring back (blog post, FAQ, person, job posting) has
  the properties those types need
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Run: pip install beautifulsoup4")
    sys.exit(1)

SITE_URL = "https://www.cennso.com"
HOME = f"{SITE_URL}/"
ORGANIZATION_ID = f"{HOME}#organization"
WEBSITE_ID = f"{HOME}#website"
SITE_NAME = "Cennso"
LEGAL_NAME = "Cennso Technologies GmbH"
PROFILES = [
    "https://github.com/cennso",
    "https://www.linkedin.com/company/cennso-technologies",
]
LOGO_MIN = 112

PAGES_DIR = Path(".next/server/pages")
PUBLIC_DIRS = (Path("public"), Path(".next/standalone/public"))

ALLOWED_TYPES = {
    "Organization",
    "WebSite",
    "Article",
    "BlogPosting",
    "ContactPage",
    "BreadcrumbList",
    "ListItem",
    "FAQPage",
    "Question",
    "Answer",
    "Person",
    "JobPosting",
    "ImageObject",
    "PostalAddress",
    "ContactPoint",
}

E164 = re.compile(r"^\+[1-9]\d{7,14}$")


def page_path_for(html_file: Path) -> str:
    """The route a prerendered file answers: index.html is /, a/b.html is /a/b."""
    route = "/" + html_file.relative_to(PAGES_DIR).with_suffix("").as_posix()
    return "/" if route == "/index" else route


def types_of(node: Dict[str, Any]) -> List[str]:
    value = node.get("@type", [])
    return value if isinstance(value, list) else [value]


def walk(value: Any):
    """Every object in a JSON value, nested ones included."""
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def find_public(name: str) -> Optional[Path]:
    for directory in PUBLIC_DIRS:
        candidate = directory / name
        if candidate.exists():
            return candidate
    return None


def check_organization(node: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    expected = {"name": SITE_NAME, "legalName": LEGAL_NAME, "url": HOME}
    for key, value in expected.items():
        if node.get(key) != value:
            errors.append(f'Organization {key} must be "{value}", got "{node.get(key)}"')
    for key in ("description", "slogan", "email"):
        if not node.get(key):
            errors.append(f"Organization missing {key}")
    if not E164.match(str(node.get("telephone", ""))):
        # The number itself stays out of the log (CodeQL counts phone numbers
        # as private data); the page's source shows it.
        errors.append("Organization telephone must be E.164: a plus sign, then 8 to 15 digits")
    if node.get("sameAs") != PROFILES:
        errors.append(f"Organization sameAs must be {PROFILES}, got {node.get('sameAs')}")

    address = node.get("address") or {}
    for key in ("streetAddress", "postalCode", "addressLocality", "addressCountry"):
        if not address.get(key):
            errors.append(f"Organization address missing {key}")

    logo = node.get("logo") or {}
    url = logo.get("url", "") if isinstance(logo, dict) else str(logo)
    if not url.startswith(f"{SITE_URL}/"):
        errors.append(f"Organization logo must be on {SITE_URL}, got {url}")
    elif find_public(url[len(SITE_URL) + 1 :]) is None:
        errors.append(f"Organization logo {url} is not in the build")
    if isinstance(logo, dict) and min(logo.get("width", 0), logo.get("height", 0)) < LOGO_MIN:
        errors.append(f"Organization logo must be at least {LOGO_MIN} px square")
    return errors


def check_website(node: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    if node.get("name") != SITE_NAME or node.get("url") != HOME:
        errors.append(f'WebSite must be "{SITE_NAME}" at {HOME}')
    if (node.get("publisher") or {}).get("@id") != ORGANIZATION_ID:
        errors.append("WebSite publisher must be the Organization")
    if "potentialAction" in node:
        errors.append("WebSite must not name a SearchAction: the site has no search")
    return errors


def check_breadcrumbs(node: Dict[str, Any], canonical: Optional[str]) -> List[str]:
    errors: List[str] = []
    items = node.get("itemListElement") or []
    if len(items) < 2:
        errors.append(f"BreadcrumbList has {len(items)} crumb(s); a trail needs at least two")
    for index, item in enumerate(items, start=1):
        if item.get("position") != index:
            errors.append(f"BreadcrumbList crumb {index} has position {item.get('position')}")
        if not item.get("name"):
            errors.append(f"BreadcrumbList crumb {index} has no name")
        if not str(item.get("item", "")).startswith(f"{SITE_URL}/"):
            errors.append(f"BreadcrumbList crumb {index} is not an address on the site")
    if items and canonical and items[-1].get("item") != canonical:
        errors.append(f"BreadcrumbList must end at the page itself, {canonical}")
    return errors


def check_other(node: Dict[str, Any]) -> List[str]:
    """What the types disabled pages may bring back need."""
    errors: List[str] = []
    kinds = types_of(node)
    if "BlogPosting" in kinds:
        for key in ("headline", "author", "datePublished", "publisher"):
            if key not in node:
                errors.append(f"BlogPosting missing {key}")
    if "FAQPage" in kinds:
        questions = node.get("mainEntity") or []
        if len(questions) < 2:
            errors.append("FAQPage needs at least two questions")
        for index, question in enumerate(questions):
            answer = question.get("acceptedAnswer") or {}
            if not question.get("name") or not answer.get("text"):
                errors.append(f"FAQPage question {index} needs a name and an answer")
    if "Person" in kinds and not node.get("name"):
        errors.append("Person missing name")
    if "JobPosting" in kinds:
        for key in ("title", "description", "datePosted", "hiringOrganization"):
            if key not in node:
                errors.append(f"JobPosting missing {key}")
    return errors


def check_page(html_file: Path) -> List[str]:
    page_path = page_path_for(html_file)
    soup = BeautifulSoup(html_file.read_text(encoding="utf-8"), "html.parser")
    scripts = soup.find_all("script", type="application/ld+json")

    if page_path == "/404":
        return ["The 404 page must carry no structured data"] if scripts else []

    canonical_tag = soup.find("link", attrs={"rel": "canonical"})
    canonical = canonical_tag.get("href") if canonical_tag else None
    errors: List[str] = []
    nodes: List[Dict[str, Any]] = []

    for index, script in enumerate(scripts, start=1):
        try:
            document = json.loads(script.string or "")
        except json.JSONDecodeError as error:
            errors.append(f"block {index} is not JSON: {error}")
            continue
        if document.get("@context") != "https://schema.org":
            errors.append(f"block {index} @context must be https://schema.org")
        nodes.extend(document.get("@graph", [document]))

    every = [node for node in walk(nodes) if "@type" in node]
    for node in every:
        unknown = [kind for kind in types_of(node) if kind not in ALLOWED_TYPES]
        if unknown:
            errors.append(f"unexpected @type {unknown}")

    by_id = {node["@id"]: node for node in every if "@id" in node and "@type" in node}
    for node in walk(nodes):
        if set(node) == {"@id"} and node["@id"] not in by_id:
            errors.append(f"reference {node['@id']} names no node of this page")

    organizations = [n for n in nodes if "Organization" in types_of(n)]
    if [n.get("@id") for n in organizations] != [ORGANIZATION_ID]:
        errors.append(f"expected one Organization {ORGANIZATION_ID}, found {[n.get('@id') for n in organizations]}")
    else:
        errors.extend(check_organization(organizations[0]))

    websites = [n for n in nodes if "WebSite" in types_of(n)]
    if [n.get("@id") for n in websites] != [WEBSITE_ID]:
        errors.append(f"expected one WebSite {WEBSITE_ID}, found {[n.get('@id') for n in websites]}")
    else:
        errors.extend(check_website(websites[0]))

    trails = [n for n in nodes if "BreadcrumbList" in types_of(n)]
    if len(trails) > 1:
        errors.append(f"{len(trails)} BreadcrumbLists; a page has one trail")
    for trail in trails:
        errors.extend(check_breadcrumbs(trail, canonical))

    if page_path.startswith("/success-stories/"):
        articles = [n for n in nodes if "Article" in types_of(n)]
        if not articles:
            errors.append("a success story must carry its Article")
        for article in articles:
            if article.get("url") != canonical or article.get("@id") != f"{canonical}#article":
                errors.append("Article must be at the page's canonical address")
            for key in ("publisher", "author"):
                if (article.get(key) or {}).get("@id") != ORGANIZATION_ID:
                    errors.append(f"Article {key} must be the Organization")
            if not article.get("headline"):
                errors.append("Article missing headline")

    if page_path == "/contact":
        contact = [n for n in nodes if "ContactPage" in types_of(n)]
        if [n.get("url") for n in contact] != [canonical]:
            errors.append("the contact page must carry one ContactPage at its canonical address")

    for node in every:
        errors.extend(check_other(node))

    return errors


def main() -> int:
    if not PAGES_DIR.exists():
        print("❌ Build directory not found. Run `yarn build` first.")
        return 1

    html_files = [
        html_file
        for html_file in sorted(PAGES_DIR.rglob("*.html"))
        # Next's generated 500 page is not ours.
        if html_file.name != "500.html" and not html_file.name.startswith("_")
    ]
    if not html_files:
        print("❌ No HTML files found in build directory.")
        return 1

    print(f"📄 Found {len(html_files)} pages to validate")
    print("=" * 50)

    failures = 0
    for html_file in html_files:
        errors = check_page(html_file)
        if errors:
            failures += 1
            print(f"\n❌ {page_path_for(html_file)}")
            for error in errors:
                print(f"   - {error}")

    print("\n📊 VALIDATION RESULTS")
    print("=" * 50)
    print(f"Pages checked: {len(html_files)}")
    print(f"Pages with errors: {failures}")

    if failures:
        print("\n💡 Tip: Test manually at https://search.google.com/test/rich-results")
        return 1

    print("\n🎉 ✅ ALL STRUCTURED DATA VALIDATION PASSED!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
