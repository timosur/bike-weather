# Build stage — install Python dependencies
FROM python:3.14-slim AS builder

WORKDIR /app
COPY pyproject.toml .
COPY . .
RUN pip install --no-cache-dir .

# Runtime stage — minimal image with Playwright Chromium
FROM python:3.14-slim

# Playwright system dependencies for Chromium
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdbus-1-3 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2 libatspi2.0-0 libwayland-client0 \
  fonts-liberation fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/* \
  && adduser --disabled-password --gecos '' --no-create-home appuser

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

# Install Playwright Chromium browser (as root, then fix permissions)
RUN playwright install chromium \
  && chmod -R o+rx /root/.cache/ms-playwright

# Set Playwright browser path for non-root user
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

USER appuser

ENTRYPOINT ["uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "8001"]
