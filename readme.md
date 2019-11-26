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

Folgende Einstellungen nach einer frischen Installation (erster Boot), mit normalen Bildschirm und Tastatur/Maus machen:

* Sprache auswählen
* Passwort für Benutzer `pi` festlegen
* Rechtsklick auf Menüleiste: Leisten-Einstellungen -> Tab Erweitert -> "Leiste bei Nichtbenutzung Minimieren" aktivieren

Im Terminal über `sudo raspi-config` folgende Einstellungen machen:
* Networking -> Hostname (Vorschlag: bscampel)
* Interfacing
  * I2C aktivieren
  * SSH Zugriff aktivieren (optional)
  * VNC Zugriff aktivieren (optional)

Optional:
  * System aktualisieren (`sudo apt-get update` und `sudo apt-get dist-upgrade`)

Folgendes Script herunterladen & ausführen:

```
wget -O - https://raw.githubusercontent.com/gingters/bsc-ampel/master/environment/install.sh --no-cache | sudo bash
```

Danach System herunterfahren (`sudo shutdown now`), an den Touchscreen und die Steuerung anschliessen (bzw. die SD-Karte in den Steuerungs-Raspberry stecken), und neu starten.

## Was das Script macht:

- Touchscreen-Support aktivieren:  
  Folgendes wird in config.txt in /boot geschrieben:  
  ```
  max_usb_current=1
  hdmi_force_hotplug=1
  config_hdmi_boost=7
  hdmi_group=2
  hdmi_mode=87
  hdmi_drive=1
  hdmi_cvt 800 480 60 6 0 0 0
  ```  
- Installiert folgende Pakete:  
  * node 10.12.0 - `sudo apt get install nodejs`
  * screen - `sudo apt-get install screen`
  * midnight commander - `sudo apt-get install mc`
- Klont dieses Repo
- Fügt BSC Logo als Splash screen hinzu
- Installiert die Node dependencies & baut das Projekt (siehe unten)
- Fügt Autostart hinzu (siehe unten)

## Weitere Infos

### Build

```
npm install
npm run full-rebuild
```

### Start

`npm run start-nobuild`

### Autostart

In `~/.config/lxsession/LXDE-pi/autostart` folgendes eintragen:
`@/home/pi/bsc-ampel/environment/start.sh`

Falls die Datei noch nicht existiert, sollte `/etc/xdg/lxsession/LXDE-pi/autostart` als Vorlage genommen werden, da diese Datei ignoriert wird wenn eine lokale Autostart existiert, und die Standard-Einträge wichtig sind.
