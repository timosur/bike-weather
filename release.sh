#!/usr/bin/env bash
set -euo pipefail

# ─── Release Script ──────────────────────────────────────────────────────────
# Auto-increments SemVer tags per service.
#
# Usage:
#   ./release.sh <service> <bump> [-preview]
#
# Examples:
#   ./release.sh frontend patch            # 1.0.0 → 1.0.1
#   ./release.sh backend minor             # 1.0.0 → 1.1.0
#   ./release.sh agent major -preview      # 1.2.3 → 2.0.0-preview.1
#   ./release.sh frontend patch -preview   # 1.0.1 → 1.0.2-preview.1
#   ./release.sh frontend patch -preview   # (again) 1.0.2-preview.1 → 1.0.2-preview.2
# ─────────────────────────────────────────────────────────────────────────────

SERVICES=("frontend" "backend" "agent")

usage() {
  echo "Usage: $0 <service> <major|minor|patch> [-preview]"
  echo ""
  echo "Services: ${SERVICES[*]}"
  echo ""
  echo "Options:"
  echo "  -preview    Create a preview (pre-release) version"
  echo ""
  echo "Examples:"
  echo "  $0 frontend patch"
  echo "  $0 backend minor -preview"
  exit 1
}

# ─── Parse arguments ─────────────────────────────────────────────────────────

[[ $# -lt 2 ]] && usage

SERVICE="$1"
BUMP="$2"
PREVIEW=false
[[ "${3:-}" == "-preview" ]] && PREVIEW=true

# Validate service
if [[ ! " ${SERVICES[*]} " =~ " ${SERVICE} " ]]; then
  echo "❌ Unknown service: ${SERVICE}"
  echo "   Valid services: ${SERVICES[*]}"
  exit 1
fi

# Validate bump type
if [[ "$BUMP" != "major" && "$BUMP" != "minor" && "$BUMP" != "patch" ]]; then
  echo "❌ Unknown bump type: ${BUMP}"
  echo "   Valid types: major, minor, patch"
  exit 1
fi

# ─── Ensure clean state & fetch tags ─────────────────────────────────────────

echo "🔄 Fetching tags…"
git fetch --tags --quiet

# ─── Resolve current version from tags ───────────────────────────────────────

# Find the latest stable tag for this service (ignore preview tags for base version)
LATEST_STABLE=$(git tag -l "${SERVICE}/v[0-9]*" --sort=-v:refname \
  | grep -E "^${SERVICE}/v[0-9]+\.[0-9]+\.[0-9]+$" \
  | head -n1 || true)

if [[ -n "$LATEST_STABLE" ]]; then
  CURRENT="${LATEST_STABLE#${SERVICE}/v}"
else
  CURRENT="0.0.0"
fi

IFS='.' read -r CUR_MAJOR CUR_MINOR CUR_PATCH <<< "$CURRENT"

echo "📌 Current stable version for ${SERVICE}: ${CURRENT}"

# ─── Compute next version ────────────────────────────────────────────────────

case "$BUMP" in
  major)
    NEXT_MAJOR=$((CUR_MAJOR + 1))
    NEXT_MINOR=0
    NEXT_PATCH=0
    ;;
  minor)
    NEXT_MAJOR=$CUR_MAJOR
    NEXT_MINOR=$((CUR_MINOR + 1))
    NEXT_PATCH=0
    ;;
  patch)
    NEXT_MAJOR=$CUR_MAJOR
    NEXT_MINOR=$CUR_MINOR
    NEXT_PATCH=$((CUR_PATCH + 1))
    ;;
esac

NEXT_VERSION="${NEXT_MAJOR}.${NEXT_MINOR}.${NEXT_PATCH}"

# ─── Handle preview suffix ──────────────────────────────────────────────────

if [[ "$PREVIEW" == true ]]; then
  # Count existing preview tags for this version to auto-increment
  PREVIEW_COUNT=$(git tag -l "${SERVICE}/v${NEXT_VERSION}-preview.*" | wc -l | tr -d ' ')
  PREVIEW_NUM=$((PREVIEW_COUNT + 1))
  FULL_VERSION="${NEXT_VERSION}-preview.${PREVIEW_NUM}"
else
  FULL_VERSION="${NEXT_VERSION}"
fi

TAG="${SERVICE}/v${FULL_VERSION}"

# ─── Confirm & tag ───────────────────────────────────────────────────────────

echo ""
echo "🏷️  New tag: ${TAG}"
echo "   Service:  ${SERVICE}"
echo "   Bump:     ${BUMP}"
echo "   Version:  ${CURRENT} → ${FULL_VERSION}"
echo ""

read -rp "Continue? [y/N] " CONFIRM
if [[ "${CONFIRM,,}" != "y" ]]; then
  echo "Aborted."
  exit 0
fi

git tag -a "$TAG" -m "release: ${SERVICE} v${FULL_VERSION}"
echo "✅ Tag created: ${TAG}"

read -rp "Push tag to origin? [y/N] " PUSH
if [[ "${PUSH,,}" != "y" ]]; then
  echo "Tag created locally. Push with: git push origin ${TAG}"
  exit 0
fi

git push origin "$TAG"
echo "🚀 Pushed ${TAG} — pipeline will build and publish the image."
