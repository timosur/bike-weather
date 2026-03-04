# Build stage — compile C extensions (asyncpg, greenlet, etc.)
FROM python:3.12-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir .

# Runtime stage — minimal image without build tools
FROM python:3.12-slim

ARG APP_VERSION=0.0.0
ENV APP_VERSION=${APP_VERSION}

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/* && \
    adduser --disabled-password --gecos '' --no-create-home appuser

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

RUN chmod +x entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
