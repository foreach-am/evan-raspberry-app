#!/usr/bin/env bash

## ----------------------------------------------------------------------------------
## init script
cd "$(dirname "$0")/../../../" || exit 1

if [[ "$(command -v realpath)" != "" ]]; then
  ROOT_DIR="$(realpath "$PWD")"
else
  ROOT_DIR="$PWD"
fi

source "$(dirname "$0")/../../includes.sh"

## ----------------------------------------------------------------------------------
## install new node modules if package.json updated
npm run tool:sum-hash:check
