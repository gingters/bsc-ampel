# Ampelsteuerung

## Prerequisites

  * node 10.12.0 - `sudo apt get install nodejs`

## Autostart on Raspberry Pi

In `~/.config/lxsession/LXDE-pi/autostart` folgendes eintragen:
`@screen -d -m npm run execute --prefix /home/pi/bsc-ampel`
