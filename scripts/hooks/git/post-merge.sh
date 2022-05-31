#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../../includes.sh"

# -----------------------------------------------------
# install new node modules if package.json updated
bash ./run-cmd.sh tool:sum-hash:check
