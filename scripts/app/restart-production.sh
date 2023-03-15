#!/usr/bin/env bash

## ----------------------------------------------------------------------------------
## init script
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

# ## ----------------------------------------------------------------------------------
# ## check and update node version
# execute_action "$BUILD_LOG_FILE" \
#   "bash ./run-cmd.sh tool:app:node-version" \
#   "Updating or installing NodeJS v18" \
#   "Failed to update or install NodeJS v18."

## ----------------------------------------------------------------------------------
## start
clear

## ----------------------------------------------------------------------------------
## check .env configuration
execute_action "$BUILD_LOG_FILE" \
  "bash ./run-cmd.sh tool:app:env-check" \
  "Checking .env configration" \
  ".env file was not configured properly or it missing."

## ----------------------------------------------------------------------------------
## check & install pm2
if [[ "$(command -v pm2)" == "" ]]; then
  execute_action "$BUILD_LOG_FILE" \
    "npm install --global pm2 --silent" \
    "Installing PM2 engine globally." \
    "Failed to install PM2 engine globally."
fi

## ----------------------------------------------------------------------------------
## restart production
execute_action "$BUILD_LOG_FILE" \
  "pm2 restart ecosystem.config.js && pm2 save --force" \
  "Starting PM2 engine app." \
  "Failed to start PM2 engine app."

## ----------------------------------------------------------------------------------
## empty message
echo ""
echo " Successfully restarted."
echo ""
