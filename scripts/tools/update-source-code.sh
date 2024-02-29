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
## pull latest
echo "Updating source code ..."
git reset --hard && git pull
EXIT_CODE=$?

if [[ $EXIT_CODE == 0 ]]; then
  echo "Successfully updated."
else
  echo "Failed with code $EXIT_CODE"
  exit $EXIT_CODE
fi

