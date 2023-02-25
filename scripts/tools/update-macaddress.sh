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
SAVED_MACADDRES_PATH="$ROOT_DIR/data/macaddress.dat"

## ----------------------------------------------------------------------------------
## variables & functions
function get_macaddress() {
  local NET_INTERFACE="$1"
  ifconfig -a "$NET_INTERFACE" | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'
}

NETWORK_INTERFACE=eth0
COMPILED_DTBO_MAC="00:08:dc:01:02:03"
CURRENT_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"

## ----------------------------------------------------------------------------------
## check mac address updated
if [[ "$COMPILED_DTBO_MAC" == "CURRENT_MACADDRESS" ]]; then
  exit 0
fi

## ----------------------------------------------------------------------------------
## update macaddress
if [[ "$(command -v macchanger)" == "" ]]; then
  cd /tmp
  sudo mkdir macchanger
  sudo chmod 777 macchanger
  cd macchanger

  wget http://ftp.debian.org/debian/pool/main/m/macchanger/macchanger_1.7.0-5.4_armhf.deb
  sudo dpkg --install macchanger_1.7.0-5.4_armhf.deb
  cd "$ROOT_DIR"
fi

SAVED_MACADDRES_VALUE=""
if [[ -f "$SAVED_MACADDRES_PATH" ]]; then
  SAVED_MACADDRES_VALUE="$(cat "$SAVED_MACADDRES_PATH")"
fi

sudo ifconfig "$NETWORK_INTERFACE" down
if [[ "$SAVED_MACADDRES_VALUE" == "" ]]; then
  sudo macchanger -r "$NETWORK_INTERFACE"
  CURRENT_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"
  echo "$CURRENT_MACADDRESS" > "$SAVED_MACADDRES_PATH"
else
  sudo macchanger -m "$SAVED_MACADDRES_VALUE" "$NETWORK_INTERFACE"
fi
sudo ifconfig "$NETWORK_INTERFACE" up
