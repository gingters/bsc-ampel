# Ampelsteuerung

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
