#!/usr/bin/env bash

# -----------------------------------------------------
# init script
cd "$(dirname "$0")/../../" || exit 1
ROOT_DIR="$PWD"
source "$(dirname "$0")/../includes.sh"

# -----------------------------------------------------
# format code - src
prettier \
  --config .prettierrc \
  --loglevel error \
  --write \
  'src/**/*.(ts|tsx|js|jsx|json)'
check_exit $? ${ERROR_APP_FORMAT_CODE[@]}

# -----------------------------------------------------
# format code - root
prettier \
  --config .prettierrc \
  --loglevel error \
  --write \
  '*.(ts|tsx|js|jsx|json)'
check_exit $? ${ERROR_APP_FORMAT_CODE[@]}
