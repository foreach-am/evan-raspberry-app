#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../includes.sh"

# -----------------------------------------------------
# build sum-hash for current packages
PKG_LATEST_HASH=""
if [[ -f "$PKG_HASH_FILENAME" ]]; then
  PKG_LATEST_HASH="$(cat "$PKG_HASH_FILENAME")"
fi

if [[ "$PKG_CURRENT_HASH" != "$PKG_LATEST_HASH" ]]; then
  echo "$PKG_CURRENT_HASH" > "$PKG_HASH_FILENAME"
fi
