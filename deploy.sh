#!/usr/bin/env bash

# go to directory
cd /home/admin/raspberry-app

# reset
git reset --hard
git checkout main
git pull
pm2 delete all
pm2 save --force
sudo systemctl stop configure-tunnel.service

# clear
rm -rf node_modules
rm -rf logs/*.log
sudo rm data/macaddress.data

# intsall
npm install

# start
pm2 start ecosystem.config.js
pm2 save --force
sudo systemctl start configure-tunnel.service
