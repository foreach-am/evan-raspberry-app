#!/usr/bin/env bash

# specify nodejs version
CPU_VERSION="armv7l"
NODE_VERSION="14.19.3"

# initiate folder
sudo mkdir -p /opt/nodejs
sudo chmod -R 777 /opt/nodejs
cd /opt/nodejs

# download & extract nodejs
wget https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz
tar -xJf node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz

# make executable link
echo "export PATH=\"\$PATH:/opt/nodejs/node-v$NODE_VERSION-linux-$CPU_VERSION/bin/\"" >> "$HOME/.bashrc"

# cleanup
sudo rm node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz
