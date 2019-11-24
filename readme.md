# Ampelsteuerung

## Installation auf frischer Raspberry-SD

1. For touchscreen support:  
Add following lines to config.txt in root  
```
max_usb_current=1
hdmi_force_hotplug=1
config_hdmi_boost=7
hdmi_group=2
hdmi_mode=87
hdmi_drive=1
hdmi_cvt 800 480 60 6 0 0 0
```  

## Prerequisites

  * node 10.12.0 - `sudo apt get install nodejs`

## Build

```
npm install
npm run full-rebuild
```

## Start

`npm run start-nobuild`

## Autostart on Raspberry Pi

In `~/.config/lxsession/LXDE-pi/autostart` folgendes eintragen:
`@screen -d -m npm run start-nobuild --prefix /home/pi/bsc-ampel`
