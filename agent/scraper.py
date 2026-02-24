"""Web scraper: fetch pages and convert HTML to clean markdown text."""

import logging

import httpx
from bs4 import BeautifulSoup
from markdownify import markdownify

from agent.config import settings

logger = logging.getLogger(__name__)


async def fetch_page(url: str) -> str:
    """Fetch a web page and return raw HTML.

    Uses a realistic User-Agent and respects the configured timeout.
    """
    headers = {"User-Agent": settings.user_agent}
    async with httpx.AsyncClient(
        timeout=settings.request_timeout,
        follow_redirects=True,
    ) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.text


def extract_text(html: str) -> str:
    """Convert HTML to clean markdown, stripping navigation, ads, and footers.

    Removes script, style, nav, footer, header, aside, and common ad/cookie
    elements before converting to markdown.
    """
    soup = BeautifulSoup(html, "html.parser")

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
