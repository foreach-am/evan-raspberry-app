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

BUILD_LOG_FILE="$ROOT_DIR/build-log.log"
if [[ -f "$BUILD_LOG_FILE" ]]; then
  rm "$BUILD_LOG_FILE" > /dev/null 2>&1
fi

trap on_process_kill SIGINT

# -----------------------------------------------------
# start
clear

echo ""
echo -e " \033[0;32m===============================================================================\033[0m"
echo -e " \033[0;32m======================      EVAN DEPLOYMENT STARTED      ======================\033[0m"
echo -e " \033[0;32m===============================================================================\033[0m"
echo ""

# -----------------------------------------------------
# check .env configuration
execute_action "$BUILD_LOG_FILE" \
  "bash ./run-cmd.sh tool:app:env-check" \
  "Checking .env configration" \
  ".env file was not configured properly or it missing."

# -----------------------------------------------------
# check node modules installed
if [[ ! -d "node_modules" ]]; then
  execute_action "$BUILD_LOG_FILE" \
    "bash ./run-cmd.sh install" \
    "Installing required dependencies" \
    "Failed to install app dependecies."
else
  execute_action "$BUILD_LOG_FILE" \
    "bash ./run-cmd.sh tool:sum-hash:check" \
    "Installing required dependency updates" \
    "Failed to install app dependency updates."
fi

# -----------------------------------------------------
# build production
execute_action "$BUILD_LOG_FILE" \
  "'$APP_NPM_CLI_BIN/react-app-rewired' build" \
  "Building pruduction release" \
  "Failed to build application."

# -----------------------------------------------------
# replace release folder
execute_action "$BUILD_LOG_FILE" \
  "rm -rf .release && mv build .release" \
  "Replacing release artifacts with new one" \
  "Failed to replace release artifacts."

# -----------------------------------------------------
# clearing cloudflare cache
if [[ ! -d "node_modules" ]]; then
  execute_action "$BUILD_LOG_FILE" \
    "bash ./run-cmd.sh tool:app:purge-cache" \
    "Clearing cloudflare cache" \
    "Failed to clear cloudflare cache."
fi
