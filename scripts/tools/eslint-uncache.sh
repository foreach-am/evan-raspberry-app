#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../" || exit 1

if [[ "$(command -v realpath)" != "" ]]; then
  ROOT_DIR="$(realpath "$PWD")"
else
  ROOT_DIR="$PWD"
fi

source "$(dirname "$0")/../includes.sh"

# -----------------------------------------------------
# remove cache folder
if [[ -d node_modules ]]; then
  rm -rf "$APP_NPM_CACHE/eslint*"
  check_exit $? ${ERROR_APP_LINT_UNCACHE[@]}
fi
