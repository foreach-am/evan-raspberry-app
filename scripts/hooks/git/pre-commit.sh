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
## format code
# bash ./run-cmd.sh tool:format:code
# check_exit $? ${ERROR_APP_FORMAT_CODE[@]}

## ----------------------------------------------------------------------------------
## execute lint
# bash ./run-cmd.sh tool:lint:execute:prod
# check_exit $? ${ERROR_APP_LINT_EXECUTE[@]}

## ----------------------------------------------------------------------------------
## format scripts
# bash ./run-cmd.sh tool:format:scripts
# check_exit $? ${ERROR_APP_FORMAT_SCRIPTS[@]}

## ----------------------------------------------------------------------------------
## add re-formatted files to git
git add .
