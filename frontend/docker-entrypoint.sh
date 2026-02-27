#!/bin/sh
set -e

# Generate runtime config from environment variables.
# The frontend reads window.__RUNTIME_CONFIG__ at startup, falling back
# to Vite's import.meta.env for local development.
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_AUTHENTIK_URL: "${VITE_AUTHENTIK_URL:-}",
  VITE_AUTHENTIK_CLIENT_ID: "${VITE_AUTHENTIK_CLIENT_ID:-}",
  VITE_TURNSTILE_SITE_KEY: "${VITE_TURNSTILE_SITE_KEY:-}"
};
EOF

exec nginx -g 'daemon off;'
