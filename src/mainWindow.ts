import { BrowserWindowConstructorOptions } from 'electron';

export const MainWindowSettings: BrowserWindowConstructorOptions = {
	autoHideMenuBar: true,
	center: true,
	frame: false,
	fullscreenable: true,
	height: 600,
	minHeight: 600,
	minWidth: 800,
	resizable: false,
	show: false,
	width: 1024,
};
