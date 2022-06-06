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
# get package manager
NODE_PACKAGE_MANAGER=""
if [[ "$(command -v yarn)" != "" ]]; then
  NODE_PACKAGE_MANAGER="yarn"
elif [[ "$(command -v npm)" != "" ]]; then
  NODE_PACKAGE_MANAGER="npm"
fi

# -----------------------------------------------------
# execute command
if [[ $NODE_PACKAGE_MANAGER == "yarn" ]]; then
  "$NODE_PACKAGE_MANAGER" "$@"
  exit $?
fi

if [[ $NODE_PACKAGE_MANAGER == "npm" ]]; then
  if [[ "$1" == "install" ]]; then
    "$NODE_PACKAGE_MANAGER" "$@"
    exit $?
  fi

  "$NODE_PACKAGE_MANAGER" run "$@"
  exit $?
fi

# -----------------------------------------------------
# if not valid package manager was fond
echo "No one of npm or yarn package manager was found."
exit 2
