#!/usr/bin/env bash

# specify nodejs version
CPU_VERSION="armv7l"
# NODE_VERSION="16.9.1"
NODE_VERSION="18.9.1"

# initiate folder
sudo mkdir -p /opt/nodejs
sudo chmod -R 777 /opt/nodejs
cd /opt/nodejs

# download & extract nodejs
wget https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz
tar -xJf node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz

# remove old links
cat "$HOME/.bashrc" | grep -v 'export PATH="$PATH:/opt/nodejs/'* > "$HOME/.bashrc_temp"
rm "$HOME/.bashrc"
mv "$HOME/.bashrc_temp" "$HOME/.bashrc"

# make executable link
echo "export PATH=\"\$PATH:/opt/nodejs/node-v$NODE_VERSION-linux-$CPU_VERSION/bin/\"" >> "$HOME/.bashrc"

# cleanup
sudo rm node-v$NODE_VERSION-linux-$CPU_VERSION.tar.xz
