#!/bin/sh
set -e

HTML_DIR=/usr/share/nginx/html

# Generate runtime config from environment variables.
# The frontend reads window.__RUNTIME_CONFIG__ at startup, falling back
# to Vite's import.meta.env for local development.
cat > "$HTML_DIR/config.js" << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_AUTHENTIK_URL: "${VITE_AUTHENTIK_URL:-}",
  VITE_AUTHENTIK_CLIENT_ID: "${VITE_AUTHENTIK_CLIENT_ID:-}",
  VITE_TURNSTILE_SITE_KEY: "${VITE_TURNSTILE_SITE_KEY:-}",
  VITE_FARO_COLLECTOR_URL: "${VITE_FARO_COLLECTOR_URL:-}"
};
EOF

# Generate domain-specific SEO files from templates containing __SITE_URL__.
# nginx serves the correct variant based on the Host header.
for domain in bike-weather.com fahrrad-wetter.com; do
  url="https://$domain"
  suffix=$(echo "$domain" | cut -d. -f1)  # bike-weather or fahrrad-wetter

  sed "s|__SITE_URL__|$url|g" "$HTML_DIR/robots.txt" > "$HTML_DIR/robots-${suffix}.txt"
  sed "s|__SITE_URL__|$url|g" "$HTML_DIR/sitemap.xml" > "$HTML_DIR/sitemap-${suffix}.xml"
done

exec nginx -g 'daemon off;'
