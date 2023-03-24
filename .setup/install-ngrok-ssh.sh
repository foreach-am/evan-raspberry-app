#!/usr/bin/env bash

# install ssh server & enable service
sudo apt -y install openssh-server
sudo systemctl restart ssh
