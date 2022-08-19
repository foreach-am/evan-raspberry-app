#!/usr/bin/env bash

# specify driver version
DRIVER_VERSION=1.49

# update system
sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y autoclean
sudo apt-get -y autoremove

# install gcc
sudo apt-get install -y gcc
sudo apt-get install -y build-essential

# download and extract driver
cd /tmp
wget http://www.airspayce.com/mikem/bcm2835/bcm2835-$DRIVER_VERSION.tar.gz
tar -zxf bcm2835-$DRIVER_VERSION.tar.gz
cd bcm2835-$DRIVER_VERSION

# install driver
./configure
make
sudo make check
sudo make install
sudo modprobe spi_bcm2835

# cleanup
cd ..
rm -rf bcm2835-$DRIVER_VERSION.tar.gz
rm -rf bcm2835-$DRIVER_VERSION
