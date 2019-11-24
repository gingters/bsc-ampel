#!/bin/sh

# Handle sudo-stuff
if ! [ $(id -u) = 0 ]; then
   echo "The script need to be run as root." >&2
   exit 1
fi

if [ $SUDO_USER ]; then
    real_user=$SUDO_USER
else
    real_user=$(whoami)
fi

# Install dependencies
apt-get update
apt-get install -y screen nodejs mc

# Clone Repo and change dir
sudo -u $real_user git clone https://github.com/gingters/bsc-ampel /home/pi/bsc-ampel
cd /home/pi/bsc-ampel

# Build project
sudo -u $real_user npm install
sudo -u $real_user npm run full-rebuild

# Add config for touch screen resolution
cat /home/pi/bsc-ampel/environment/config.txt >> /boot/config.txt

# Change splash logo
mv /usr/share/plymouth/themes/pix/splash.png /usr/share/plymouth/themes/pix/backup.png
cp /home/pi/bsc-ampel/environment/bsc-logo.png /usr/share/plymouth/themes/pix/splash.png

# Add project to Autostart
sudo -u $real_user mkdir -p /home/pi/.config/lxsession/LXDE-pi
sudo -u $real_user cp /etc/xdg/lxsession/LXDE-pi/autostart /home/pi/.config/lxsession/LXDE-pi/autostart
sudo -u $real_user echo "@/home/pi/bsc-ampel/environment/start.sh" >> /home/pi/.config/lxsession/LXDE-pi/autostart

echo "System kann jetzt neu gestartet werden"
