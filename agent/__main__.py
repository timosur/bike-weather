"""Allow running as `python -m agent` — starts the FastAPI server."""

import uvicorn

uvicorn.run("agent.server:app", host="127.0.0.1", port=8001, log_level="info")
