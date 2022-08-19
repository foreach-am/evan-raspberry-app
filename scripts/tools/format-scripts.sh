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
## format code - scripts
prettier \
  --config .prettierrc \
  --loglevel error \
  --write \
  'scripts/**/*.(bash|sh)'
check_exit $? ${ERROR_APP_FORMAT_SCRIPT[@]}
