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
  sudo macchanger -r "$NETWORK_INTERFACE"

  if [[ $? != 0 ]]; then
    sudo apt -y remove --purge macchanger
    sudo apt -y autoremove
    sudo apt -y autoclean
    sudo apt -y install macchanger

    sudo macchanger -r "$NETWORK_INTERFACE"
  fi

  echo ">>>>>>>>> Saving new MAC Address ..."
  UPDATED_MACADDRESS="$(get_macaddress "$NETWORK_INTERFACE")"
  echo "$UPDATED_MACADDRESS" > "$SAVED_MACADDRES_PATH"
else
  echo ">>>>>>>>> Updating MAC Address ..."
  sudo macchanger -m "$SAVED_MACADDRES_VALUE" "$NETWORK_INTERFACE"
fi

echo ">>>>>>>>> Putting network network: up"
network_state "up"
