"""Tests for the web scraper."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from agent.scraper import extract_text, fetch_page


SAMPLE_HTML = """\
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <style>body { color: black; }</style>
    <script>console.log("hello");</script>
</head>
<body>
    <nav>
        <ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li></ul>
    </nav>
    <header>
        <h1>Site Header</h1>
    </header>
    <main>
        <h2>Cycling Rain Jackets</h2>
        <div class="product">
            <h3>Gore Wear C5 Shakedry</h3>
            <p>Ultralight waterproof cycling jacket. Price: €179.99</p>
            <a href="https://example.com/product/1">Buy now</a>
        </div>
        <div class="product">
            <h3>Castelli Perfetto RoS 2</h3>
            <p>Wind and water resistant. Price: €229.99</p>
            <a href="https://example.com/product/2">Buy now</a>
        </div>
    </main>
    <aside class="sidebar">
        <p>Newsletter signup</p>
    </aside>
    <div class="cookie-banner">
        <p>We use cookies</p>
    </div>
    <footer>
        <p>© 2025 Test Shop</p>
    </footer>
</body>
</html>
"""


class TestFetchPage:
    @pytest.mark.asyncio
    async def test_fetch_page_returns_html(self):
        """Mock httpx returns sample HTML."""
        mock_response = httpx.Response(
            200,
            text=SAMPLE_HTML,
            request=httpx.Request("GET", "https://example.com"),
        )

        with patch("agent.scraper.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            html = await fetch_page("https://example.com")

            assert "<html>" in html.lower() or "cycling" in html.lower()
            mock_client.get.assert_called_once()


class TestExtractText:
    def test_extract_text_strips_navigation(self):
        """HTML-to-markdown removes nav, footer, ads."""
        text = extract_text(SAMPLE_HTML)

        # Product content should be present
        assert "Gore Wear C5 Shakedry" in text
        assert "Castelli Perfetto RoS 2" in text
        assert "179.99" in text

        # Nav, header, footer, sidebar, cookie banner should be removed
        assert "Home" not in text
        assert "About" not in text
        assert "Site Header" not in text
        assert "2025 Test Shop" not in text
        assert "Newsletter signup" not in text
        assert "We use cookies" not in text

    def test_extract_text_strips_scripts_and_styles(self):
        text = extract_text(SAMPLE_HTML)
        assert "console.log" not in text
        assert "color: black" not in text

    def test_extract_text_empty_html(self):
        text = extract_text("")
        assert text == ""

    def test_extract_text_no_excessive_blank_lines(self):
        """Result should not have multiple consecutive blank lines."""
        text = extract_text(SAMPLE_HTML)
        assert "\n\n\n" not in text
