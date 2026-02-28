#!/usr/bin/env bash
# traffic-report.sh — Quick traffic report for bike-weather.com
# Parses nginx reverse-proxy access logs via kubectl and shows resource usage.
#
# Usage:
#   ./scripts/traffic-report.sh [--since=24h] [--namespace=bike-weather]
#
set -uo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
SINCE="24h"
NAMESPACE="bike-weather"
DEPLOYMENT="bike-weather-nginx"

# ── Argument parsing ─────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --since=*)   SINCE="${arg#*=}" ;;
    --namespace=*) NAMESPACE="${arg#*=}" ;;
    --help|-h)
      echo "Usage: $0 [--since=24h] [--namespace=bike-weather]"
      echo ""
      echo "Options:"
      echo "  --since=DURATION   kubectl logs time window (default: 24h)"
      echo "  --namespace=NS     Kubernetes namespace (default: bike-weather)"
      exit 0
      ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# ── Colors (strip if not a terminal) ─────────────────────────────────────────
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'
  CYAN=$'\033[1;36m'
  GREEN=$'\033[0;32m'
  YELLOW=$'\033[0;33m'
  RED=$'\033[0;31m'
  DIM=$'\033[2m'
  RESET=$'\033[0m'
else
  BOLD="" CYAN="" GREEN="" YELLOW="" RED="" DIM="" RESET=""
fi

header() {
  printf "\n%s━━━ %s ━━━%s\n" "$CYAN" "$1" "$RESET"
}

# ── Preflight checks ─────────────────────────────────────────────────────────
if ! command -v kubectl &>/dev/null; then
  echo "Error: kubectl not found in PATH" >&2
  exit 1
fi

if ! kubectl cluster-info &>/dev/null 2>&1; then
  echo "Error: Cannot connect to Kubernetes cluster" >&2
  exit 1
fi

# ── Temp file for logs ────────────────────────────────────────────────────────
LOGFILE=$(mktemp)
trap 'rm -f "$LOGFILE"' EXIT

# ── Banner ────────────────────────────────────────────────────────────────────
printf "%sbike-weather.com Traffic Report%s\n" "$BOLD" "$RESET"
printf "%sNamespace: %s  |  Window: last %s  |  Source: %s logs%s\n" "$DIM" "$NAMESPACE" "$SINCE" "$DEPLOYMENT" "$RESET"
printf "%sGenerated: %s%s\n" "$DIM" "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$RESET"

# ── Fetch logs ────────────────────────────────────────────────────────────────
header "Fetching Logs"
printf "Pulling nginx access logs... "

kubectl logs "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --since="${SINCE}" 2>/dev/null \
  | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+ ' > "$LOGFILE" || true

TOTAL=$(wc -l < "$LOGFILE" | tr -d ' ')

if [[ "$TOTAL" -eq 0 ]]; then
  printf "%sno access log lines found%s\n" "$YELLOW" "$RESET"
  echo ""
  echo "No requests in the last ${SINCE}. The pod may have recently restarted,"
  echo "or there has been no traffic. Try a wider window: --since=72h"
  header "Pod Status"
  kubectl get pods -n "${NAMESPACE}" -o wide 2>/dev/null || echo "(could not fetch pod list)"
  exit 0
fi

printf "%s%d requests%s\n" "$GREEN" "$TOTAL" "$RESET"

# ── Summary ───────────────────────────────────────────────────────────────────
header "Summary"

# Nginx log format: $1=proxy_ip ... $9=status $10=bytes ... last quoted field = real client IP
# Extract real client IPs (last quoted field, the X-Forwarded-For IP)
UNIQUE_IPS=$(awk -F'"' '{print $(NF-1)}' "$LOGFILE" | grep -E '^[0-9]' | sort -u | wc -l | tr -d ' ')
# Also count unique proxy IPs in case X-Forwarded-For is missing
if [[ "$UNIQUE_IPS" -eq 0 ]]; then
  UNIQUE_IPS=$(awk '{print $1}' "$LOGFILE" | sort -u | wc -l | tr -d ' ')
fi

TOTAL_BYTES=$(awk '{sum += $10} END {printf "%d", sum+0}' "$LOGFILE")

# Human-readable bytes
format_bytes() {
  local bytes=${1:-0}
  if   (( bytes >= 1073741824 )); then printf "%.2f GB" "$(echo "$bytes / 1073741824" | bc -l)"
  elif (( bytes >= 1048576 ));    then printf "%.2f MB" "$(echo "$bytes / 1048576" | bc -l)"
  elif (( bytes >= 1024 ));       then printf "%.2f KB" "$(echo "$bytes / 1024" | bc -l)"
  else printf "%d B" "$bytes"
  fi
}

# Time span from first to last log entry
FIRST_TS=$(head -1 "$LOGFILE" | awk -F'[][]' '{print $2}' | cut -d' ' -f1)
LAST_TS=$(tail -1 "$LOGFILE" | awk -F'[][]' '{print $2}' | cut -d' ' -f1)

# Convert nginx timestamp (dd/Mon/yyyy:HH:MM:SS) to epoch for duration calc
ts_to_epoch() {
  local ts="$1"
  if [[ -z "$ts" ]]; then echo 0; return; fi
  # macOS date -jf or GNU date -d
  if date --version &>/dev/null 2>&1; then
    # GNU date
    local formatted
    formatted=$(echo "$ts" | sed 's|/| |g; s|:| |1')
    date -d "$formatted" +%s 2>/dev/null || echo 0
  else
    # macOS date
    date -jf "%d/%b/%Y:%H:%M:%S" "$ts" +%s 2>/dev/null || echo 0
  fi
}

FIRST_EPOCH=$(ts_to_epoch "$FIRST_TS")
LAST_EPOCH=$(ts_to_epoch "$LAST_TS")

if (( FIRST_EPOCH > 0 && LAST_EPOCH > 0 && LAST_EPOCH > FIRST_EPOCH )); then
  DURATION_SECS=$(( LAST_EPOCH - FIRST_EPOCH ))
  AVG_RPS=$(echo "scale=2; $TOTAL / $DURATION_SECS" | bc -l 2>/dev/null || echo "n/a")
else
  DURATION_SECS=0
  AVG_RPS="n/a"
fi

printf "  %-24s %s\n" "Total requests:" "$TOTAL"
printf "  %-24s %s\n" "Unique client IPs:" "$UNIQUE_IPS"
printf "  %-24s %s\n" "Bandwidth (body):" "$(format_bytes "$TOTAL_BYTES")"
printf "  %-24s %s\n" "Log window:" "${FIRST_TS:-?} → ${LAST_TS:-?}"
if [[ "$AVG_RPS" != "n/a" ]]; then
  printf "  %-24s %s req/s\n" "Avg requests/sec:" "$AVG_RPS"
fi

# ── Status Code Breakdown ────────────────────────────────────────────────────
header "Status Codes"

awk '{
  code = $9
  if      (code ~ /^2/) c2++
  else if (code ~ /^3/) c3++
  else if (code ~ /^4/) c4++
  else if (code ~ /^5/) c5++
  else other++
  total++
}
END {
  if (total > 0) {
    printf "  2xx (success):     %6d  (%5.1f%%)\n", c2+0, (c2+0)/total*100
    printf "  3xx (redirect):    %6d  (%5.1f%%)\n", c3+0, (c3+0)/total*100
    printf "  4xx (client err):  %6d  (%5.1f%%)\n", c4+0, (c4+0)/total*100
    printf "  5xx (server err):  %6d  (%5.1f%%)\n", c5+0, (c5+0)/total*100
    if (other+0 > 0) printf "  other:             %6d  (%5.1f%%)\n", other, other/total*100
  }
}' "$LOGFILE"

# ── Top Paths ─────────────────────────────────────────────────────────────────
header "Top 20 Paths (excl. health checks)"

awk '{
  path = $7
  if (path == "/nginx-health" || path == "/health") next
  count[path]++
}
END {
  for (p in count) printf "%d\t%s\n", count[p], p
}' "$LOGFILE" | sort -rn | head -20 | while IFS=$'\t' read -r cnt path; do
  printf "  %s%6d%s  %s\n" "$GREEN" "$cnt" "$RESET" "$path"
done

# ── Top Source IPs (real client IPs from X-Forwarded-For) ─────────────────────
header "Top 20 Client IPs"

awk -F'"' '{ip=$(NF-1); if (ip ~ /^[0-9]/) print ip}' "$LOGFILE" \
  | sort | uniq -c | sort -rn | head -20 | while read -r cnt ip; do
  printf "  %s%6d%s  %s\n" "$GREEN" "$cnt" "$RESET" "$ip"
done

# ── Hourly Histogram ─────────────────────────────────────────────────────────
header "Requests per Hour"

awk -F'[][]' '{print $2}' "$LOGFILE" \
  | awk -F: '{printf "%s %s:00\n", $1, $2}' \
  | sort | uniq -c | sort -k2,3 | while read -r cnt day hour; do
  bar=""
  len=$(( cnt / 5 ))
  (( len < 1 && cnt > 0 )) && len=1
  (( len > 60 )) && len=60
  for (( i=0; i<len; i++ )); do bar+="#"; done
  printf "  %s %s  %s%5d%s  %s\n" "$day" "$hour" "$CYAN" "$cnt" "$RESET" "$bar"
done

# ── Peak Minutes ──────────────────────────────────────────────────────────────
header "Top 10 Busiest Minutes"

awk -F'[][]' '{print $2}' "$LOGFILE" \
  | awk -F: '{printf "%s %s:%s\n", $1, $2, $3}' \
  | sort | uniq -c | sort -rn | head -10 | while read -r cnt day time; do
  printf "  %s%5d%s req  %s %s\n" "$GREEN" "$cnt" "$RESET" "$day" "$time"
done

# ── User Agents ───────────────────────────────────────────────────────────────
header "Top 10 User Agents"

awk -F'"' '{print $6}' "$LOGFILE" | sort | uniq -c | sort -rn | head -10 | while read -r cnt; do
  ua="${cnt#* }"
  cnt="${cnt%% *}"
  printf "  %s%5d%s  %s\n" "$GREEN" "$cnt" "$RESET" "$ua"
done

# ── Pod Status ────────────────────────────────────────────────────────────────
header "Pod Status"

kubectl get pods -n "${NAMESPACE}" -o wide --no-headers 2>/dev/null \
  | awk '{printf "  %-45s %-10s %-8s %-5s %s\n", $1, $3, $5, $6, $7}' \
  || echo "  (could not fetch pod list)"

# ── Resource Usage ────────────────────────────────────────────────────────────
header "Resource Usage (kubectl top)"

if kubectl top pods -n "${NAMESPACE}" --no-headers 2>/dev/null | head -1 | grep -q .; then
  kubectl top pods -n "${NAMESPACE}" 2>/dev/null \
    | awk 'NR==1 {printf "  %-45s %-12s %s\n", $1, $2, $3; next}
           {printf "  %-45s %-12s %s\n", $1, $2, $3}'
else
  printf "  %s(metrics-server not available or no data)%s\n" "$DIM" "$RESET"
fi

echo ""
printf "%sDone. For richer observability consider deploying Prometheus + Grafana.%s\n" "$DIM" "$RESET"
