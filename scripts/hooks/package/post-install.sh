#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../../includes.sh"

# -----------------------------------------------------
# execute post-install

# run command: tool:husky:init
bash ./run-cmd.sh tool:husky:init
exit_on_fail $?

# run command: tool:sum-hash:build
bash ./run-cmd.sh tool:sum-hash:build
exit_on_fail $?
