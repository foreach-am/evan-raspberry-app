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
npm run tool:format:code
check_exit $? ${ERROR_APP_FORMAT_CODE[@]}

## ----------------------------------------------------------------------------------
## clear old lint cache
npm run tool:lint:uncache
check_exit $? ${ERROR_APP_LINT_UNCACHE[@]}

## ----------------------------------------------------------------------------------
## execute lint
npm run tool:lint:execute:prod
check_exit $? ${ERROR_APP_LINT_EXECUTE[@]}

## ----------------------------------------------------------------------------------
## format scripts
npm run tool:format:scripts
check_exit $? ${ERROR_APP_FORMAT_SCRIPTS[@]}

## ----------------------------------------------------------------------------------
## add re-formatted files to git
git add .
