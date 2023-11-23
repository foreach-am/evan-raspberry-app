#!/usr/bin/env bash

# specify nodejs version
NODE_VERSION="18.9.1"
INSTALL_FLDER="/opt/nodejs"

# initiate folder
sudo mkdir -p "$INSTALL_FLDER"
sudo chmod -R 777 "$INSTALL_FLDER"
cd "$INSTALL_FLDER"

# CPU architecture
CPU_ARCH="$(lscpu | grep 'Architecture' | cut -c 14-100 | sed 's/^ *//g;s/ *$//g')"

# download & extract nodejs
NODE_ARCHIVE="node-v$NODE_VERSION-linux-$CPU_ARCH.tar.xz"

URL_OFFICIAL_BUILD="https://nodejs.org/dist/v$NODE_VERSION/$NODE_ARCHIVE"
URL_UNOFFICIAL_BUILD="https://unofficial-builds.nodejs.org/download/release/v$NODE_VERSION/$NODE_ARCHIVE"

wget "$URL_OFFICIAL_BUILD"
if [[ $? != 0 ]]; then
  wget "$URL_UNOFFICIAL_BUILD"
  if [[ $? != 0 ]]; then
    echo "No any release version found for $NODE_ARCHIVE"
    exit 2
  fi
fi

tar -xJf "$NODE_ARCHIVE"

# remove old links
cat "$HOME/.bashrc" | grep -v "export PATH=\"$PATH:$INSTALL_FLDER\""* > "$HOME/.bashrc_temp"
rm "$HOME/.bashrc"
mv "$HOME/.bashrc_temp" "$HOME/.bashrc"

# make executable link
echo "export PATH=\"\$PATH:/$INSTALL_FLDER/node-v$NODE_VERSION-linux-$CPU_ARCH/bin/\"" >> "$HOME/.bashrc"
if [[ -d /usr/local/bin ]]; then
  EXECUTABLES="node npm npx"
  for EXECUTABLE in $EXECUTABLES; do
    sudo rm "/usr/local/bin/$EXECUTABLE"
    sudo ln -s \
      "/$INSTALL_FLDER/node-v$NODE_VERSION-linux-$CPU_ARCH/bin/$EXECUTABLE" \
      "/usr/local/bin/$EXECUTABLE"
  done
fi

# cleanup
sudo rm "$NODE_ARCHIVE"
