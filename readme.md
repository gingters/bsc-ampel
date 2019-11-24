# Ampelsteuerung

## Installation auf frischer Raspberry-SD

Wir benutzen die September 2019 Version von Raspbian:

```
Raspbian Buster with desktop and recommended software
Image with desktop and recommended software based on Debian Buster
Version: September 2019
Release date: 2019-09-26
Kernel version: 4.19
Size: 2541 MB
```

Folgende Einstellungen nach einem frischen reboot machen:

* Rechtsklick auf Menüleiste: Leisten-Einstellungen -> Tab Erweitert -> "Leiste bei Nichtbenutzung Minimieren" aktivieren
* Passwort für Benutzer `pi` festlegen
* SSH Zugriff aktivieren (optional)


Folgendes Script herunterladen & ausführen:

```
wget -O - https://raw.githubusercontent.com/gingters/bsc-ampel/master/environment/install.sh --no-cache | sudo bash
```

### What the script does:

- For touchscreen support:  
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
- Install  
  * node 10.12.0 - `sudo apt get install nodejs`
  * screen - `sudo apt-get install screen`
  * midnight commander - `sudo apt-get install mc`
- Provide Splash screen
- Clone the repo
- Install node dependencies
- Build the project
- Add Autostart command 

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
