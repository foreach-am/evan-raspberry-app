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
## check & install service
REBOOT_REQUIRED=0
function check_install_service() {
  SERVICE_NAME="$1"
  SERVICE_INSTALL_PATH="/etc/systemd/system/$SERVICE_NAME"
  SERVICE_SOURCE_PATH="$ROOT_DIR/.setup/stubs/$2"

  if [[ -f "$SERVICE_SOURCE_PATH" ]]; then
    NEED_TO_CHANGE=1
    if [[ -f "$SERVICE_INSTALL_PATH" ]]; then
      OUTPUT_INSTALL="$(cat "$SERVICE_INSTALL_PATH" | xargs)"
      OUTPUT_SOURCE="$(cat "$SERVICE_SOURCE_PATH" | xargs)"

      if [[ "$OUTPUT_INSTALL" == "$OUTPUT_SOURCE" ]]; then
        NEED_TO_CHANGE=0
      else
        sudo rm "$SERVICE_INSTALL_PATH"
      fi
    fi

    if [[ $NEED_TO_CHANGE == 1 ]]; then
      sudo cp "$SERVICE_SOURCE_PATH" "$SERVICE_INSTALL_PATH"
      sudo sed -i "s|{{ROOT}}|$ROOT_DIR|g" "$SERVICE_INSTALL_PATH"

      sudo systemctl enable "$SERVICE_NAME"
      sudo systemctl start "$SERVICE_NAME"

      REBOOT_REQUIRED=1
    fi
  fi
}

## ----------------------------------------------------------------------------------
## start
clear

echo ""
echo -e " \033[0;32m===============================================================================\033[0m"
echo -e " \033[0;32m======================      EVAN DEPLOYMENT STARTED      ======================\033[0m"
echo -e " \033[0;32m===============================================================================\033[0m"
echo ""

## ----------------------------------------------------------------------------------
## addcronjob tas to autoupdate source code
COMMAND_EXISTS="$(crontab -l | grep -v '^#' | grep 'tool:update-source-code' | wc -l)"
if [[ $COMMAND_EXISTS == 0 ]]; then
  (crontab -l; echo "0 4 * * * cd '"$ROOT_DIR"' && npm run tool:update-source-code") \
    | sort - \
    | uniq - \
    | crontab -
fi

## ----------------------------------------------------------------------------------
## register macaddress updater service
CPU_ARCH="$(lscpu | grep 'Architecture' | cut -c 14-100 | sed 's/^ *//g;s/ *$//g')"
if [[ "$CPU_ARCH" == "armv6l" ]]; then
  SERVICE_NAME_TYPE="network-online"
else
  SERVICE_NAME_TYPE="network-pre"
fi

SERVICE_NAME="configure-macaddress.service"
SERVICE_FILE="configure-macaddress/$SERVICE_NAME_TYPE.service"
check_install_service "$SERVICE_NAME" "$SERVICE_FILE"

## ----------------------------------------------------------------------------------
## register tunnel updater service
SERVICE_NAME="configure-tunnel.service"
SERVICE_FILE="configure-tunnel.service"
check_install_service "$SERVICE_NAME" "$SERVICE_FILE"

## ----------------------------------------------------------------------------------
## check .env configuration
execute_action "$BUILD_LOG_FILE" \
  "bash ./run-cmd.sh tool:app:env-check" \
  "Checking .env configuration" \
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
  "pm2 delete all && pm2 save --force" \
  "Deleting previous PM2 engine app." \
  "Failed to delete previous PM2 engine app."

execute_action "$BUILD_LOG_FILE" \
  "pm2 restart ecosystem.config.js && pm2 save --force" \
  "Starting PM2 engine app." \
  "Failed to start PM2 engine app."

## ----------------------------------------------------------------------------------
## create system service
if [[ "$(command -v systemctl)" != "" ]]; then
  SYSTEM_SERVICE_EXISTS="$(\
    systemctl --all --type service \
      | grep "pm2-$USER.service" \
      | wc -l \
  )"

  if [[ "$SYSTEM_SERVICE_EXISTS" == "0" ]]; then
    NODE_INSTALL_DIR="$(npm config get prefix)"
    NODE_PATH_BIN="$NODE_INSTALL_DIR/bin"
    NODE_PATH_LIB="$NODE_INSTALL_DIR/lib/node_modules"

    execute_action "$BUILD_LOG_FILE" \
      "\
        sudo env PATH=\$PATH:$NODE_PATH_BIN $NODE_PATH_LIB/pm2/bin/pm2 startup systemd -u $USER --hp $HOME && \
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
## finished message

echo ""
if [[ $REBOOT_REQUIRED == 1 ]]; then
  echo " Build completed sucessfully, but restart required."
else
  echo " Build completed sucessfully."
fi
echo ""

if [[ $REBOOT_REQUIRED == 1 ]]; then
  echo " Restaring device after 5 seconds."
  sleep 5

  sudo reboot
fi
