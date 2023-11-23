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

if [[ "$(command -v macchanger)" == "" ]]; then
  # echo ">>>>>>>>> Downloading macchanger source..."
  # cd /tmp
  # sudo mkdir macchanger
  # sudo chmod 777 macchanger
  # cd macchanger
  # wget http://ftp.debian.org/debian/pool/main/m/macchanger/macchanger_1.7.0-5.4_armhf.deb

  echo ">>>>>>>>> Installing macchanger ..."
  sudo apt install -y macchanger
  # sudo dpkg --install macchanger_1.7.0-5.4_armhf.deb
  # rm macchanger_1.7.0-5.4_armhf.deb
  # cd "$ROOT_DIR"
fi

## ----------------------------------------------------------------------------------
## variables & functions
function get_macaddress() {
  local NET_INTERFACE="$1"
  ifconfig -a "$NET_INTERFACE" | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'
}

function network_state() {
  local NEW_STATE="$1"

  echo ">>>>>>>>> Putting network network: $NEW_STATE"
  sudo ifconfig "$NETWORK_INTERFACE" "$NEW_STATE"
}

NETWORK_INTERFACE=eth0
CURRENT_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"

## ----------------------------------------------------------------------------------
## update macaddress
SAVED_MACADDRES_VALUE=""
if [[ -f "$SAVED_MACADDRES_PATH" ]]; then
  SAVED_MACADDRES_VALUE="$(cat "$SAVED_MACADDRES_PATH")"
fi

if [[ "$CURRENT_MACADDRESS" == "$SAVED_MACADDRES_VALUE" ]]; then
  echo ">>>>>>>>> MAC Address already updated, value: $SAVED_MACADDRES_VALUE"
  exit 0
fi

network_state "down"
if [[ "$SAVED_MACADDRES_VALUE" == "" ]]; then
  echo ">>>>>>>>> Generating new MAC Address ..."
  sudo macchanger -r "$NETWORK_INTERFACE"

  echo ">>>>>>>>> Saving new MAC Address ..."
  CURRENT_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"
  echo "$CURRENT_MACADDRESS" > "$SAVED_MACADDRES_PATH"
else
  echo ">>>>>>>>> Updating MAC Address ..."
  sudo macchanger -m "$SAVED_MACADDRES_VALUE" "$NETWORK_INTERFACE"
fi

network_state "up"
