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
## variables & functions
function get_macaddress() {
  local NET_INTERFACE="$1"
  ifconfig -a "$NET_INTERFACE" | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'
}

NETWORK_INTERFACE=eth0
COMPILED_DTBO_MAC="00:08:dc:01:02:03"
CURRENT_MAC="$(get_macaddress "$NETWORK_INTERFACE")"

## ----------------------------------------------------------------------------------
## check mac address updated
if [[ "$COMPILED_DTBO_MAC" == "CURRENT_MAC" ]]; then
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

sudo ifconfig "$NETWORK_INTERFACE" down
sudo macchanger -r "$NETWORK_INTERFACE"
sudo ifconfig "$NETWORK_INTERFACE" up
