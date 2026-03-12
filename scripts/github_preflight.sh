#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/home/node/.openclaw/workspace/rohbauabnahme-web}"
cd "$REPO_DIR"

err() { echo "[preflight][ERROR] $*" >&2; }
info() { echo "[preflight] $*"; }

if ! command -v git >/dev/null 2>&1; then
  err "git nicht gefunden"
  exit 10
fi

if ! command -v gh >/dev/null 2>&1; then
  err "gh CLI nicht gefunden"
  exit 11
fi

if [ ! -d .git ]; then
  err "kein Git-Repo: $REPO_DIR"
  exit 12
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  err "origin remote fehlt"
  exit 13
fi

if ! gh auth status >/dev/null 2>&1; then
  err "GitHub Auth fehlt/ungueltig (gh auth status)"
  exit 14
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
remote="$(git remote get-url origin)"
info "ok repo=$REPO_DIR"
info "ok branch=$branch"
info "ok origin=$remote"

exit 0
