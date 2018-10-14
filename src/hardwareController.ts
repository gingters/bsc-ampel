import { Gpio, GpioImpl } from './onoff';
import { ITournamentState, Light, Shooters } from './tournament';

export class HardwareController {

	private honkLength: number = 500;
	private honkPause: number = 250;

	private readonly red: Gpio;
	private readonly yellow: Gpio;
	private readonly green: Gpio;
	private readonly ab: Gpio;
	private readonly cd: Gpio;
	private readonly honker: Gpio;

	private readonly all: Gpio[];

	constructor() {
		if (GpioImpl.accessible) {
			const config = { activeLow: true };

			this.red = new GpioImpl(5, 'low', config);
			this.yellow = new GpioImpl(6, 'high', config);
			this.green = new GpioImpl(12, 'high', config);

			this.ab = new GpioImpl(13, 'low', config);
			this.cd = new GpioImpl(16, 'high', config);

			this.honker = new GpioImpl(17, 'high', config);

			this.all = [
				this.red,
				this.yellow,
				this.green,
				this.ab,
				this.cd,
				this.honker,
			];
		}
	}

	public update(tournamentState: ITournamentState) {
		if (!GpioImpl.accessible) {
			return;
		}

		this.setLight(tournamentState.currentLight);
		this.setShooters(tournamentState.currentShooters);
		this.honk(tournamentState.honks);
	}

	public stop(): void {
		if (!GpioImpl.accessible) {
			return;
		}

		this.all.forEach((io) => io.writeSync(0));
	}

	private setLight(light: Light) {
		this.red.writeSync(light === 'red' ? 1 : 0);
		this.yellow.writeSync(light === 'yellow' ? 1 : 0);
		this.green.writeSync(light === 'green' ? 1 : 0);
	}

	private setShooters(shooters: Shooters) {
		this.ab.writeSync(shooters === 'A/B' ? 1 : 0);
		this.cd.writeSync(shooters === 'C/D' ? 1 : 0);
	}

	private honk(amount: number) {
		if (amount <= 0) {
			return;
		}

		// tslint:disable-next-line
		console.log(`Honking ${amount} times.`);

		let gap = 0;
		for (let i = 0; i < amount; i++) {
			const startTime = gap;
			const endTime = gap + this.honkLength;
			gap += this.honkLength + this.honkPause;

			// tslint:disable-next-line
			console.log(`Honk ${i + 1} ON in ${startTime}, OFF in ${endTime}...`);

			setTimeout(() => {
				// tslint:disable-next-line
				console.log(`Honk ${i} ON`);
				this.honker.writeSync(1);
			}, startTime);

			setTimeout(() => {
				// tslint:disable-next-line
				console.log(`Honk ${i} OFF`);
				this.honker.writeSync(0);
			}, endTime);
		}
	}
}
