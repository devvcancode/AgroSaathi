#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/web/app/api"
BACKUP_DIR="$(mktemp -d)"
BACKUP_PATH="$BACKUP_DIR/api"

cleanup() {
  if [ -d "$API_DIR" ] && [ -d "$BACKUP_PATH" ]; then
    rm -rf "$API_DIR"
  fi

  if [ -d "$BACKUP_PATH" ]; then
    mkdir -p "$(dirname "$API_DIR")"
    mv "$BACKUP_PATH" "$API_DIR"
  fi

  rm -rf "$BACKUP_DIR"
}

if [ -d "$API_DIR" ]; then
  mv "$API_DIR" "$BACKUP_PATH"
fi

trap cleanup EXIT

cd "$PROJECT_ROOT"
npm run build
