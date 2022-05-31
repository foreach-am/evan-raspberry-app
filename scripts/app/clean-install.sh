#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../includes.sh"

# -----------------------------------------------------
# cleanup root
rm -rf "$ROOT_DIR/node_modules" > /dev/null 2>&1
rm "$ROOT_DIR/yarn.lock" > /dev/null 2>&1
rm "$ROOT_DIR/package-lock.json" > /dev/null 2>&1

# -----------------------------------------------------
# install dependencies
bash ./run-cmd.sh install
bash ./scripts/hooks/package/post-install.sh
