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
## macaddress
MACADDRESS_STORE_FILE="$ROOT_DIR/data/macaddress.data"
DEFAULT_MACADDRESS="00:08:dc:01:02:03"

function generate_macaddress() {
  local CURRENT_MACADDRESS="$(get_macaddress)"
  echo "CURRENT_MACADDRESS = $CURRENT_MACADDRESS"
  echo "DEFAULT_MACADDRESS = $DEFAULT_MACADDRESS"

  if [[ -f "$MACADDRESS_STORE_FILE" ]]; then
    CURRENT_MACADDRESS="$(cat "$MACADDRESS_STORE_FILE")"
  fi
  echo "CURRENT_MACADDRESS_FILE = $CURRENT_MACADDRESS"

  if [[ \
    "$CURRENT_MACADDRESS" == "$DEFAULT_MACADDRESS" || \
    "$CURRENT_MACADDRESS" == "" \
  ]]; then
    CURRENT_MACADDRESS="$(\
      printf '%02x:%02x:%02x:%02x:%02x:%02x\n' \
        "$[RANDOM%255]" "$[RANDOM%255]" "$[RANDOM%255]" \
        "$[RANDOM%255]" "$[RANDOM%255]" "$[RANDOM%255]" \
    )"
  fi

  echo "CURRENT_MACADDRESS_FINAL = $CURRENT_MACADDRESS"
  echo "$CURRENT_MACADDRESS"
}
function store_macaddress() {
  sudo rm -rf "$MACADDRESS_STORE_FILE"
  echo "$1" > "$MACADDRESS_STORE_FILE"
}

## ----------------------------------------------------------------------------------
## install tools if missing
if [[ "$(command -v ifconfig)" == "" ]]; then
  echo ">>>>>>>>> Installing net-tools ..."
  sudo apt-get -y install net-tools
fi

## ----------------------------------------------------------------------------------
## update macaddress
CURRENT_MACADDRESS="$(get_macaddress)"
if [[ "$CURRENT_MACADDRESS" != "$DEFAULT_MACADDRESS" ]]; then
  store_macaddress "$CURRENT_MACADDRESS"
  echo ">>>>>>>>> MAC Address already updated, value: $CURRENT_MACADDRESS"
  exit 0
fi

echo ">>>>>>>>> Generating new MAC Address ..."
NEW_MACADDRES_VALUE="$(generate_macaddress)"
echo ">>>>>>>>> New Mac Address value will be \"$NEW_MACADDRES_VALUE\""

echo ">>>>>>>>> Putting network network: down"
sudo ifconfig "$NETWORK_INTERFACE" "down"

echo ">>>>>>>>> Setting new MAC Address ..."
sudo ifconfig "$NETWORK_INTERFACE" hw ether "$NEW_MACADDRES_VALUE"

echo ">>>>>>>>> Putting network network: up"
sudo ifconfig "$NETWORK_INTERFACE" "up"

store_macaddress "$NEW_MACADDRES_VALUE"
