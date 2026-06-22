#!/usr/bin/env bash
#
# Build and push the Schulz Döner Control container images to Docker Hub.
#
#   florianrth/doener-control-api   (server/Dockerfile)
#   florianrth/doener-control-web   (web/Dockerfile)
#
# Each image is tagged with both the git short SHA and a moving tag (default
# "latest"). Uses `docker buildx` so it can produce multi-arch images.
#
# Usage:
#   scripts/docker-build-push.sh                 # build + push :latest and :<sha>
#   scripts/docker-build-push.sh v1.2.0          # also tag + push :v1.2.0
#   NO_PUSH=1 scripts/docker-build-push.sh        # build locally only (single arch, --load)
#   TARGET=api scripts/docker-build-push.sh        # build only the api image (api|web|all)
#   PLATFORMS=linux/amd64,linux/arm64 scripts/docker-build-push.sh   # multi-arch
#   VITE_API_BASE=https://api.example.com scripts/docker-build-push.sh   # separate-origin web build
#
# Requires: docker (with buildx) and, for pushing, a prior `docker login`.

set -euo pipefail

# ── configuration (override via env) ─────────────────────────────────────────
API_IMAGE="${API_IMAGE:-florianrth/doener-control-api}"
WEB_IMAGE="${WEB_IMAGE:-florianrth/doener-control-web}"
MOVING_TAG="${MOVING_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64}"
TARGET="${TARGET:-all}"          # api | web | all
VITE_API_BASE="${VITE_API_BASE:-}"
VERSION_TAG="${1:-}"              # optional explicit tag, e.g. a release version

# Repo root = parent of this script's directory.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Image version: explicit arg wins, else the git short SHA (with -dirty marker).
if [[ -n "$VERSION_TAG" ]]; then
  SHA_TAG="$VERSION_TAG"
else
  SHA_TAG="$(git -C "$ROOT" rev-parse --short HEAD)"
  if ! git -C "$ROOT" diff --quiet || ! git -C "$ROOT" diff --cached --quiet; then
    SHA_TAG="${SHA_TAG}-dirty"
  fi
fi

# ── push vs local-load decision ──────────────────────────────────────────────
# Multi-arch images cannot be loaded into the local docker engine, only pushed.
if [[ "${NO_PUSH:-0}" == "1" ]]; then
  if [[ "$PLATFORMS" == *,* ]]; then
    echo "ERROR: NO_PUSH=1 cannot build multi-arch ($PLATFORMS). Set a single PLATFORMS." >&2
    exit 1
  fi
  OUTPUT_FLAG="--load"
  echo ">> NO_PUSH set — building locally (--load), not pushing."
else
  OUTPUT_FLAG="--push"
fi

echo ">> Repo root : $ROOT"
echo ">> Platforms : $PLATFORMS"
echo ">> Tags      : $SHA_TAG, $MOVING_TAG"
echo ">> Target    : $TARGET"
echo

# ── ensure a buildx builder exists ───────────────────────────────────────────
if ! docker buildx inspect doener-builder >/dev/null 2>&1; then
  echo ">> Creating buildx builder 'doener-builder'."
  docker buildx create --name doener-builder --driver docker-container --use >/dev/null
else
  docker buildx use doener-builder
fi

# ── build helper ─────────────────────────────────────────────────────────────
build_image() {
  local image="$1" context="$2" dockerfile="$3"; shift 3
  echo ">> Building $image ..."
  docker buildx build \
    --platform "$PLATFORMS" \
    -f "$dockerfile" \
    -t "${image}:${SHA_TAG}" \
    -t "${image}:${MOVING_TAG}" \
    "$@" \
    $OUTPUT_FLAG \
    "$context"
  echo ">> Done: ${image}:${SHA_TAG} (+ :${MOVING_TAG})"
  echo
}

if [[ "$TARGET" == "api" || "$TARGET" == "all" ]]; then
  build_image "$API_IMAGE" "$ROOT/server" "$ROOT/server/Dockerfile"
fi

if [[ "$TARGET" == "web" || "$TARGET" == "all" ]]; then
  build_image "$WEB_IMAGE" "$ROOT/web" "$ROOT/web/Dockerfile" \
    --build-arg "VITE_API_BASE=${VITE_API_BASE}"
fi

echo ">> All requested images processed."
