#!/usr/bin/env bash

# specify nodejs version
# NODE_VERSION="16.9.1"
NODE_VERSION="18.9.1"

# initiate folder
sudo mkdir -p /opt/nodejs
sudo chmod -R 777 /opt/nodejs
cd /opt/nodejs

# download & extract nodejs
wget https://unofficial-builds.nodejs.org/download/release/$NODE_VERSION/node-$NODE_VERSION-linux-armv6l.tar.gz;
tar -xJf node-v$NODE_VERSION-linux-armv6l.tar.gz

# remove old links
cat "$HOME/.bashrc" | grep -v 'export PATH="$PATH:/opt/nodejs/'* > "$HOME/.bashrc_temp"
rm "$HOME/.bashrc"
mv "$HOME/.bashrc_temp" "$HOME/.bashrc"

# make executable link
echo "export PATH=\"\$PATH:/opt/nodejs/node-v$NODE_VERSION-linux-armv6l/bin/\"" >> "$HOME/.bashrc"
if [[ -d /usr/local/bin ]]; then
  EXECUTABLES="node npm npx"
  for EXECUTABLE in $EXECUTABLES; do
    sudo rm "/usr/local/bin/$EXECUTABLE"
    sudo ln -s \
      "/opt/nodejs/node-v$NODE_VERSION-linux-armv6l/bin/$EXECUTABLE" \
      "/usr/local/bin/$EXECUTABLE"
  done
fi

# cleanup
sudo rm node-v$NODE_VERSION-linux-armv6l.tar.xz
