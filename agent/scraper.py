"""Web scraper: fetch pages and convert HTML to clean markdown text."""

import logging

import httpx
from bs4 import BeautifulSoup
from markdownify import markdownify

from agent.config import settings

logger = logging.getLogger(__name__)


async def fetch_page(url: str) -> str:
    """Fetch a web page and return fully-rendered HTML.

    Uses Playwright (headless Chromium) to handle JavaScript-rendered pages
    like bike-components.de. Falls back to plain httpx if Playwright is not
    installed.
    """
    try:
        return await _fetch_with_playwright(url)
    except ImportError:
        logger.warning(
            "playwright not installed — falling back to plain HTTP "
            "(JS-rendered content will be missing)"
        )
        return await _fetch_with_httpx(url)


async def _fetch_with_playwright(url: str) -> str:
    """Render a page with headless Chromium via Playwright."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=settings.user_agent,
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()
        await page.goto(
            url, wait_until="networkidle", timeout=int(settings.request_timeout * 1000)
        )
        # Give any lazy-loaded product tiles a moment to appear
        await page.wait_for_timeout(2000)
        html = await page.content()
        await browser.close()
    return html


async def _fetch_with_httpx(url: str) -> str:
    """Simple HTTP GET (no JS rendering)."""
    headers = {"User-Agent": settings.user_agent}
    async with httpx.AsyncClient(
        timeout=settings.request_timeout,
        follow_redirects=True,
    ) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.text


def extract_text(html: str) -> str:
    """Convert HTML to clean text suitable for LLM product extraction.

    For bike-components.de (and similar JS-rendered shops), we first try to
    extract structured product tiles directly.  If that succeeds, we return a
    concise listing that the LLM can parse easily.  Otherwise, we fall back to
    the generic markdown conversion.
    """
    soup = BeautifulSoup(html, "html.parser")

    # ── bike-components.de: structured product tiles ──
    product_links = soup.select('a[href*="/en/"][class*=product]')
    if product_links:
        return _extract_product_tiles(product_links)

    # ── Generic fallback: convert entire page to markdown ──
    return _extract_generic_markdown(soup)


def _extract_product_tiles(product_links: list) -> str:
    """Build a clean text listing from product tile <a> elements."""
    lines: list[str] = []
    seen: set[str] = set()

    for link in product_links:
        href = link.get("href", "")
        if not href or href in seen:
            continue
        seen.add(href)

        text = link.get_text(" ", strip=True)
        if not text:
            continue

        # Build a full URL if relative
        if href.startswith("/"):
            href = f"https://www.bike-components.de{href}"

        # Find image URL if present
        img = link.select_one("img")
        img_url = ""
        if img:
            img_url = img.get("src") or img.get("data-src") or ""
            if img_url.startswith("/"):
                img_url = f"https://www.bike-components.de{img_url}"

        lines.append(f"Product: {text}")
        lines.append(f"URL: {href}")
        if img_url:
            lines.append(f"Image: {img_url}")
        lines.append("")

    return "\n".join(lines).strip()


def _extract_generic_markdown(soup: BeautifulSoup) -> str:
    """Fallback: strip non-content elements and convert to markdown."""

    # Remove non-content elements
    tags_to_remove = [
        "script",
        "style",
        "nav",
        "footer",
        "header",
        "aside",
        "noscript",
        "iframe",
        "svg",
    ]
    for tag_name in tags_to_remove:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # Remove elements by common ad/cookie/popup class/id patterns
    patterns = [
        "cookie",
        "consent",
        "banner",
        "popup",
        "modal",
        "overlay",
        "sidebar",
        "newsletter",
        "subscribe",
        "social",
        "share",
        "advert",
        "promo",
        "sponsored",
    ]

    def _matches_pattern(tag) -> bool:
        """Check if a tag's class or id contains any of the blocked patterns."""
        classes = tag.get("class", [])
        class_str = " ".join(classes).lower() if classes else ""
        id_str = (tag.get("id") or "").lower()
        return any(p in class_str or p in id_str for p in patterns)

    for el in soup.find_all(_matches_pattern):
        el.decompose()

    # Convert to markdown
    md = markdownify(str(soup), strip=["img"])

    # Clean up excessive whitespace
    lines = []
    prev_blank = False
    for line in md.splitlines():
        stripped = line.strip()
        if not stripped:
            if not prev_blank:
                lines.append("")
                prev_blank = True
        else:
            lines.append(stripped)
            prev_blank = False

    return "\n".join(lines).strip()
