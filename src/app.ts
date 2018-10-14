import { app, BrowserWindow } from 'electron';
import * as readline from 'readline';
import { HardwareController } from './hardwareController';
import { MainWindowSettings } from './mainWindow';
import { Tournament } from './tournament';
import { TournamentRunner } from './tournamentRunner';
import { WebServer } from './webServer';

class Program {

	private mainWindow: BrowserWindow = null;
	private runner: TournamentRunner = null;
	private webServer: WebServer = null;
	private tournament: Tournament = null;
	private hardwareController: HardwareController = null;

	public main(): void {
		this.attachElectronAppEvents();
		this.hardwareController = new HardwareController();

		this.startWebServer();
		this.startTournament();

		// runner connects webserver and tournament
		this.startRunner();

		if (process.platform === 'win32') {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			rl.on('SIGINT', () => {
				process.emit('SIGINT');
			});
		}

		process.on('SIGINT', () => {
			this.shutdown();
		});
	}

	private shutdown() {
		this.stopApplication();
		// graceful shutdown
		process.exit();
	}

	private startRunner() {
		this.runner = new TournamentRunner(this.tournament);
		this.runner.start();

		this.runner.on('state-update', (data) => {
			this.hardwareController.update(data);
			this.webServer.send('state-update', data);
		});

		this.webServer.on('ui-command', (data: any) => {
			switch (data.command) {
				case 'start-end':
					this.tournament.startEnd();
					break;
				case 'abort-end':
					this.tournament.endCurrentEnd();
					break;
				case 'reset':
					this.tournament.reset();
					break;
				case 'close-application':
					this.stopApplication();
					break;
				case 'save-settings':
					this.tournament.configure(data.settings);
					break;
				default:
					break;
			}
		});
	}

	private startWebServer() {
		this.webServer = new WebServer();
		this.webServer.start();
	}

	private startTournament() {
		this.tournament = new Tournament();
	}

	private stopApplication() {
		if (this.runner !== null) {
			this.runner.stop();
			this.runner = null;
		}

		if (this.tournament !== null) {
			this.tournament.endCurrentEnd();
			this.tournament = null;
		}

		if (this.webServer !== null) {
			this.webServer.stop();
			this.webServer = null;
		}

		this.hardwareController.stop();
		this.hardwareController = null;

		if (this.mainWindow !== null) {
			this.mainWindow.close();
		}

		if (process.platform !== 'darwin') {
			app.quit();
		}
	}

	private attachElectronAppEvents() {
		app.on('ready', this.createElectronMainWindow);

		app.on('activate', () => {
			if (this.mainWindow === null) {
				this.createElectronMainWindow();
			}
		});

		app.on('window-all-closed', () => {
			this.stopApplication();
		});
	}

	private createElectronMainWindow(): void {
		this.mainWindow = new BrowserWindow(MainWindowSettings);
		// this.mainWindow.webContents.openDevTools();

		this.mainWindow.loadURL('http://localhost:8080/control.html');

		this.mainWindow.once('ready-to-show', () => {
			this.mainWindow.maximize();
			this.mainWindow.show();
		});

		this.mainWindow.on('closed', () => {
			this.mainWindow = null;
		});
	}
}

const program = new Program();
program.main();
