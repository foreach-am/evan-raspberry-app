#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../../includes.sh"

# -----------------------------------------------------
# execute prepare
bash ./run-cmd.sh tool:husky:init
exit_on_fail $?
