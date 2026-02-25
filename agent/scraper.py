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


def _best_srcset_url(srcset: str) -> str:
    """Parse an HTML srcset attribute and return the highest-resolution URL."""
    candidates: list[tuple[str, int]] = []
    for entry in srcset.split(","):
        parts = entry.strip().split()
        if not parts:
            continue
        url = parts[0]
        width = 0
        if len(parts) > 1:
            descriptor = parts[1].lower()
            if descriptor.endswith("w"):
                try:
                    width = int(descriptor[:-1])
                except ValueError:
                    pass
            elif descriptor.endswith("x"):
                try:
                    width = int(float(descriptor[:-1]) * 1000)
                except ValueError:
                    pass
        candidates.append((url, width))
    if not candidates:
        return ""
    # Return the URL with the largest width descriptor
    candidates.sort(key=lambda c: c[1], reverse=True)
    return candidates[0][0]


def _upscale_image_url(url: str) -> str:
    """Try to request a higher-resolution variant of a product image URL.

    Many shops encode image dimensions in the URL path or query parameters.
    This function applies common patterns to request larger images.
    """
    import re

    if not url:
        return url

    # bike-components.de: URLs often contain size like /200x200/ or _200x200
    # Replace small dimensions with larger ones
    url = re.sub(r"/(\d{2,3})x(\d{2,3})/", "/800x800/", url)
    url = re.sub(r"_(\d{2,3})x(\d{2,3})", "_800x800", url)

    # Common CDN patterns: width/height query params
    url = re.sub(r"([?&])w=\d+", r"\g<1>w=800", url)
    url = re.sub(r"([?&])h=\d+", r"\g<1>h=800", url)
    url = re.sub(r"([?&])width=\d+", r"\g<1>width=800", url)
    url = re.sub(r"([?&])height=\d+", r"\g<1>height=800", url)

    return url


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

        # Find image URL if present — prefer highest resolution available
        img = link.select_one("img")
        img_url = ""
        if img:
            # Try srcset first for higher-res images
            srcset = img.get("srcset") or img.get("data-srcset") or ""
            if srcset:
                img_url = _best_srcset_url(srcset)
            if not img_url:
                img_url = img.get("src") or img.get("data-src") or ""
            if img_url.startswith("/"):
                img_url = f"https://www.bike-components.de{img_url}"
            # Try to upscale thumbnail URLs by replacing size parameters
            img_url = _upscale_image_url(img_url)

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

    # Convert to markdown (keep images so LLM can extract URLs)
    md = markdownify(str(soup))

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
