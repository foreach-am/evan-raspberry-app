#!/usr/bin/env bash

# initiate folder
sudo mkdir -p /opt/teamviewer
sudo chmod -R 777 /opt/teamviewer
cd /opt/teamviewer

# download teamviewer
wget https://download.teamviewer.com/download/linux/teamviewer-host_armhf.deb

# install teamviewer
sudo dpkg --install teamviewer-host_armhf.deb
