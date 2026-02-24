"""Locale detection middleware: sets request.state.locale from Accept-Language or ?lang= param."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

SUPPORTED_LOCALES = {"de", "en"}
DEFAULT_LOCALE = "de"


def _parse_accept_language(header: str) -> str:
    """Return the best matching locale from the Accept-Language header."""
    for part in header.split(","):
        lang = part.split(";")[0].strip().lower()
        short = lang.split("-")[0]
        if short in SUPPORTED_LOCALES:
            return short
    return DEFAULT_LOCALE


class LocaleMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Query param takes precedence
        lang_param = request.query_params.get("lang")
        if lang_param and lang_param in SUPPORTED_LOCALES:
            locale = lang_param
        else:
            accept = request.headers.get("accept-language", "")
            locale = _parse_accept_language(accept)

        request.state.locale = locale
        response = await call_next(request)
        response.headers["Content-Language"] = locale
        return response
