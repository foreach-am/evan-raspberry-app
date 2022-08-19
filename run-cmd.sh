#!/usr/bin/env bash

## ----------------------------------------------------------------------------------
## init script
source "$(dirname "$0")/scripts/includes.sh"
cd "$(dirname "$0")/" || exit 1

## ----------------------------------------------------------------------------------
## pass data to node package manager command
bash ./scripts/tools/pm-run.sh "$@"
