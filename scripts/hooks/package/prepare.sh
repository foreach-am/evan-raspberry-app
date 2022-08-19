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
## execute prepare
bash ./run-cmd.sh tool:husky:init
exit_on_fail $?
