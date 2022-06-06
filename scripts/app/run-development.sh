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
# check node modules installed
if [[ ! -d "node_modules" ]]; then
  log_action_title "Installing required dependencies ..."
  bash ./run-cmd.sh install
  check_exit $? ${ERROR_INSTALL_MODULES[@]}
fi

# -----------------------------------------------------
# start development server
"$APP_NPM_CLI_BIN/nodemon" --config nodemon.json
