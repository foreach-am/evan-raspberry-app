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
SAVED_MACADDRES_PATH="$ROOT_DIR/data/macaddress.data"

## ----------------------------------------------------------------------------------
## install tools if missing
if [[ "$(command -v ifconfig)" == "" ]]; then
  echo ">>>>>>>>> Installing net-tools ..."
  sudo apt-get -y install net-tools
fi

if [[ "$(command -v spoof)" == "" ]]; then
  echo ">>>>>>>>> Installing spoof ..."
  sudo npm install --location=global spoof
  npm install --location=global spoof
fi

## ----------------------------------------------------------------------------------
## update macaddress
SAVED_MACADDRES_VALUE=""
if [[ -f "$SAVED_MACADDRES_PATH" ]]; then
  SAVED_MACADDRES_VALUE="$(cat "$SAVED_MACADDRES_PATH")"
  if [[ "$SAVED_MACADDRES_VALUE" == "00:08:dc:01:02:03" ]]; then
    SAVED_MACADDRES_VALUE=""
  fi
fi

if [[ "$CURRENT_MACADDRESS" == "$SAVED_MACADDRES_VALUE" ]]; then
  echo ">>>>>>>>> MAC Address already updated, value: $SAVED_MACADDRES_VALUE"
  exit 0
fi

echo ">>>>>>>>> Putting network network: down"
network_state "down"

if [[ "$SAVED_MACADDRES_VALUE" == "" ]]; then
  echo ">>>>>>>>> Generating new MAC Address ..."
  sudo spoof randomize "$NETWORK_INTERFACE"

  echo ">>>>>>>>> Saving new MAC Address ..."
  UPDATED_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"
  echo "$UPDATED_MACADDRESS" > "$SAVED_MACADDRES_PATH"
else
  echo ">>>>>>>>> Updating MAC Address ..."
  sudo spoof set "$SAVED_MACADDRES_VALUE" "$NETWORK_INTERFACE"
fi

echo ">>>>>>>>> Putting network network: up"
network_state "up"
