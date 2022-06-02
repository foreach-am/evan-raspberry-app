#!/usr/bin/env bash

# require sudo for first
sudo -v

# variables
SERVICE_FILE=/lib/systemd/system/setmac.service
CONFIG_FILE=/boot/config.txt
MAC_ADDRESS=""

# reacmac address
echo -n "Please enter MAC address: "
read MAC_ADDRESS

# update configs
if [[ ! -f "$CONFIG_FILE" ]]; then
  sudo touch "$CONFIG_FILE"
fi

FOUND="$(cat "$CONFIG_FILE" | grep dtparam | wc -l)"
if [[ "$FOUND" != "0" ]]; then
  sudo sed "s/dtparam/#dtparam/g" -i "$CONFIG_FILE"
  sudo sed "s/dtoverlay/#dtoverlay/g" -i "$CONFIG_FILE"
fi

sudo echo "dtparam=spi=on" | sudo tee -a "$CONFIG_FILE" > /dev/null
sudo echo "dtoverlay=w5500" | sudo tee -a "$CONFIG_FILE" > /dev/null
sudo echo "" | sudo tee -a "$CONFIG_FILE" > /dev/null

# generate service
if [[ -f "$SERVICE_FILE" ]]; then
  sudo mv "$SERVICE_FILE" "$SERVICE_FILE.backup.$(date +%Y.%m.%d.%H.%M.%S)"
fi

sudo touch "$SERVICE_FILE"
sudo echo "[Unit]" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "Description=Set MAC address for W5500 module" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "Wants=network-pre.target" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "Before=network-pre.target" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "BindsTo=sys-subsystem-net-devices-eth0.device" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "After=sys-subsystem-net-devices-eth0.device" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "[Service]" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "Type=oneshot" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "ExecStart=/sbin/ip link set dev eth0 address $MAC_ADDRESS" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "ExecStart=/sbin/ip link set dev eth0 up" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "[Install]" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "WantedBy=multi-user.target" | sudo tee -a "$SERVICE_FILE" > /dev/null
sudo echo "" | sudo tee -a "$SERVICE_FILE" > /dev/null

sudo chmod 644 "$SERVICE_FILE"
sudo systemctl daemon-reload
sudo systemctl enable "$(basename "$SERVICE_FILE")"

# reboot
sudo reboot
