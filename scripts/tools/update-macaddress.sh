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
## install tools if missing
if [[ "$(command -v ifconfig)" == "" ]]; then
  echo ">>>>>>>>> Installing net-tools ..."
  sudo apt-get -y install net-tools
fi

## ----------------------------------------------------------------------------------
## update macaddress
CURRENT_MACADDRESS="$(get_macaddress)"
if [[ "$CURRENT_MACADDRESS" != "00:08:dc:01:02:03" ]]; then
  echo ">>>>>>>>> MAC Address already updated, value: $CURRENT_MACADDRESS"
  exit 0
fi

echo ">>>>>>>>> Generating new MAC Address ..."
NEW_MACADDRES_VALUE="$(\
  printf '%02x:%02x:%02x:%02x:%02x:%02x\n' \
  "$[RANDOM%255]" "$[RANDOM%255]" "$[RANDOM%255]" \
  "$[RANDOM%255]" "$[RANDOM%255]" "$[RANDOM%255]" \
)"
echo "New Mac Address will bew \"$NEW_MACADDRES_VALUE\""

echo ">>>>>>>>> Putting network network: down"
sudo ifconfig "$NETWORK_INTERFACE" "down"

echo ">>>>>>>>> Setting new MAC Address ..."
sudo ifconfig "$NETWORK_INTERFACE" hw ether "$NEW_MACADDRES_VALUE"

echo ">>>>>>>>> Putting network network: up"
sudo ifconfig "$NETWORK_INTERFACE" "up"
