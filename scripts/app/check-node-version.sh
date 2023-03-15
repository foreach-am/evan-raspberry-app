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

## ----------------------------------------------------------------------------------
## start

MUST_INSTALL_NODE=0
if [[ "$(command -v node)" == "" ]]; then
  MUST_INSTALL_NODE=1
else
  NODE_VESION="$(node -v | sed 's|v||g')"
  if [[ "$NODE_VERSION" != 16.* && "$NODE_VERSION" != 18.* ]]; then
    MUST_INSTALL_NODE=1
  fi
fi

if [[ $MUST_INSTALL_NODE == 1 ]]; then
  bash "$ROOT_DIR/.setup/install-nodejs.sh"
  exit $?
fi
