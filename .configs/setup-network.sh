#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

# require sudo for first
sudo -v

# variables
CONFIG_OVERLAS=/boot/overlays
CONFIG_FILE=/boot/config.txt
CONFIG_DTS_FILE="w5500-spi1-overlay.dts"
CONFIG_DTBO_FILE="w5500-spi1.dtbo"

# configure
cd stubs

dtc \
  --symbols \
  --in-format dts \
  --out-format dtb \
  --out "$CONFIG_DTBO_FILE" \
  "$CONFIG_DTS_FILE"

cp "$CONFIG_DTBO_FILE" "$CONFIG_OVERLAS"

FOUND="$(cat "$CONFIG_FILE" | grep dtparam | wc -l)"
if [[ "$FOUND" != "0" ]]; then
  sudo sed "s/dtparam/#dtparam/g" -i "$CONFIG_FILE"
  sudo sed "s/dtoverlay/#dtoverlay/g" -i "$CONFIG_FILE"
fi

sudo echo "dtparam=spi=on" | sudo tee -a "$CONFIG_FILE" > /dev/null
sudo echo "dtoverlay=w5500-spi1,spi1-1cs,cs1_pin=12" | sudo tee -a "$CONFIG_FILE" > /dev/null
sudo echo "" | sudo tee -a "$CONFIG_FILE" > /dev/null
