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

## ----------------------------------------------------------------------------------
## start
clear

echo ""
echo -e " \033[0;32m===============================================================================\033[0m"
echo -e " \033[0;32m======================      EVAN DEPLOYMENT STARTED      ======================\033[0m"
echo -e " \033[0;32m===============================================================================\033[0m"
echo ""

## ----------------------------------------------------------------------------------
## check .env configuration
execute_action "$BUILD_LOG_FILE" \
  "bash ./run-cmd.sh tool:app:env-check" \
  "Checking .env configration" \
  ".env file was not configured properly or it missing."

## ----------------------------------------------------------------------------------
## check node modules installed
if [[ ! -d "node_modules" ]]; then
  execute_action "$BUILD_LOG_FILE" \
    "bash ./run-cmd.sh install --silent" \
    "Installing required dependencies" \
    "Failed to install app dependecies."
else
  execute_action "$BUILD_LOG_FILE" \
    "bash ./run-cmd.sh tool:sum-hash:check" \
    "Installing required dependency updates" \
    "Failed to install app dependency updates."
fi

## ----------------------------------------------------------------------------------
## check & install pm2
if [[ "$(command -v pm2)" == "" ]]; then
  execute_action "$BUILD_LOG_FILE" \
    "npm install --global pm2 --silent" \
    "Installing PM2 engine globally." \
    "Failed to install PM2 engine globally."
fi

## ----------------------------------------------------------------------------------
## build production
execute_action "$BUILD_LOG_FILE" \
  "pm2 restart ecosystem.config.js && pm2 save --force" \
  "Starting PM2 engine app." \
  "Failed to start PM2 engine app."

execute_action "$BUILD_LOG_FILE" \
  "pm2 save --force" \
  "Saving re-created PM2 engine app state." \
  "Failed to save re-created PM2 engine app state."

execute_action "$BUILD_LOG_FILE" \
  "pm2 update" \
  "Updating PM2 in-memory cache." \
  "Failed to update PM2 in-memory cache."

## ----------------------------------------------------------------------------------
## create system service
if [[ "$(command -v systemctl)" != "" ]]; then
  SYSTEM_EXISTS="$(systemctl --all --type service | grep "pm2-$USER.service" | wc -l)"
  if [[ "$SYSTEM_EXISTS" == "0" ]]; then
    NODE_INSTALL_DIR="$(npm config get prefix)"
    NODE_PATH_BON="$NODE_INSTALL_DIR/bin"
    NODE_PATH_LIB="$NODE_INSTALL_DIR/lib/node_modules"

    execute_action "$BUILD_LOG_FILE" \
      "\
        sudo env PATH=\$PATH:$NODE_BON_PATH $NODE_PATH_LIB/pm2/bin/pm2 startup systemd -u $USER --hp $HOME && \
        sudo systemctl enable pm2-$USER.service && \
        sudo systemctl start pm2-$USER.service &&
        pm2 save --force && \
        sudo reboot \
      " \
      "Creating PM2 system service." \
      "Failed to create PM2 system service."
  fi
fi

## ----------------------------------------------------------------------------------
## empty message
echo ""
echo " Successfully restarted."
echo ""
