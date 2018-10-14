
export enum State {
	Idle,
	Waiting,
	Shooting,
}

export type Light = 'red' | 'yellow' | 'green';
export type Shooters = 'A/B' | 'C/D';
export type Honks = 0 | 1 | 2 | 3;

export interface ITournamentState {
	currentLight: Light;
	currentShooters: Shooters;
	endsShot: number;
	totalEnds: number;
	secondsLeft: number;
	shooting: boolean;
	honks: Honks;
}

export interface ITournamentConfig {
	waitTimeInSeconds: number;
	arrowsPerEnd: number;
	secondsPerArrow: number;
	yellowPhaseInSeconds: number;
	numberOfEnds: number;
	alternatingShooters: boolean;
}

export class Tournament {
	private state: State = State.Idle;
	private endStart: Date = null;

	private currentLight: Light = 'red';
	private currentShooters: Shooters = 'A/B';
	private endsShot: 0;

	private configuration: ITournamentConfig = {
		alternatingShooters: true,
		arrowsPerEnd: 3,
		numberOfEnds: 20,
		secondsPerArrow: 40,
		waitTimeInSeconds: 10,
		yellowPhaseInSeconds: 30,
	};

	constructor() {
		this.initializeState();
	}

	public configure(configuration: ITournamentConfig): void {
		if (this.state === State.Idle) {
			this.configuration = configuration;
			this.initializeState();
		} else {
			throw new Error(`Invalid state "${this.state}" to change configuration`);
		}
	}

	public startEnd(date?: Date): void {
		this.endStart = new Date((date || new Date()).valueOf());
	}

	public endCurrentEnd(now?: Date): void {
		now = now || new Date();

		if (this.state !== State.Shooting) {
			return;
		}

		// skip forward to next step
		const waitTime = this.configuration.waitTimeInSeconds;
		const firstGroup = this.isFirstGroupOfEnd();
		const shootingEnd = firstGroup
			? this.addToDate(this.endStart, waitTime + this.getShootingTimeInSeconds())
			: this.addToDate(this.endStart, waitTime * 2 + this.getShootingTimeInSeconds() * 2);

		const remainingWaitingTime = Math.ceil(shootingEnd.getTime() - now.getTime());

		if (remainingWaitingTime > 0) {
			// cheat, and set endStart backwards by the difference we calculated
			this.endStart = new Date(this.endStart.valueOf() - remainingWaitingTime);
		}
	}

	public reset(): void {
		this.endCurrentEnd();
		this.initializeState();
	}

	// Should be called at least a few times per second, ideally in 10ths of seconds or faster
	public tick(now?: Date): ITournamentState {
		now = now || new Date();

		switch (this.state) {
			case State.Idle: return this.handleIdleState(now);
			case State.Waiting: return this.handleWaitingState(now);
			case State.Shooting: return this.handleShootingState(now);
			default: throw new Error(`Tournament is in invalid state: ${this.state}.`);
		}
	}

	private initializeState(): void {
		this.endStart = null;
		this.currentLight = 'red';
		this.currentShooters = 'A/B';
		this.endsShot = 0;
	}

	private handleIdleState(now: Date): ITournamentState {
		if (this.endStart === null) {
			// still idling
			return this.getCurrentState();
		} else if (now >= this.endStart) {
			// end has started, so change state:
			this.state = State.Waiting;
			// Waiting is start of preparation phase, so we need to honk 2 times
			return this.getCurrentState(this.configuration.waitTimeInSeconds, 2);
		}
	}

	private handleWaitingState(now: Date): ITournamentState {
		// we only need to check if waiting is over
		const waitingEnd = this.isFirstGroupOfEnd()
			? this.addToDate(this.endStart, this.configuration.waitTimeInSeconds)
			: this.addToDate(this.endStart, this.configuration.waitTimeInSeconds * 2 + this.getShootingTimeInSeconds());

		if (now <= waitingEnd) {
			// we're still waiting, so wait...
			const remainingWaitingTimeInFullSeconds = Math.ceil((waitingEnd.getTime() - now.getTime()) / 1000);
			return this.getCurrentState(remainingWaitingTimeInFullSeconds);
		} else {
			// waiting is over, so progress to next state
			this.state = State.Shooting;
			this.currentLight = 'green';
			return this.getCurrentState(this.getShootingTimeInSeconds(), 1);
		}
	}

	private handleShootingState(now: Date): ITournamentState {
		const waitTime = this.configuration.waitTimeInSeconds;
		const firstGroup = this.isFirstGroupOfEnd();
		const shootingEnd = firstGroup
			? this.addToDate(this.endStart, waitTime + this.getShootingTimeInSeconds())
			: this.addToDate(this.endStart, waitTime * 2 + this.getShootingTimeInSeconds() * 2);

		if (now <= shootingEnd) {
			const remainingTime = Math.ceil((shootingEnd.getTime() - now.getTime()) / 1000);

			// check if we need to switch to yellow phase
			if (this.currentLight === 'green' && (remainingTime <= this.configuration.yellowPhaseInSeconds)) {
				this.currentLight = 'yellow';
			}

			// we're still shooting, so continue counting
			return this.getCurrentState(remainingTime);
		} else {
			// shooting is over, so check whether we need switch shooters or stop the end
			if (this.configuration.alternatingShooters && firstGroup) {
				// do 2nd round
				this.state = State.Waiting;
				this.switchShooters();
				this.currentLight = 'red';
				return this.getCurrentState(this.configuration.waitTimeInSeconds, 2);
			} else {
				this.state = State.Idle;
				this.endStart = null;

				this.currentLight = 'red';
				this.endsShot += 1;

				if (this.endsShot >= this.configuration.numberOfEnds) {
					this.endsShot = 0;
				}

				return this.getCurrentState(null, 3);
			}
		}
	}

	private getCurrentState(secondsLeft?: number, honks?: Honks): ITournamentState {
		secondsLeft = Number.isInteger(secondsLeft) ? secondsLeft : null;
		honks = honks || 0;

		return {
			currentLight: this.currentLight,
			currentShooters: this.currentShooters,
			endsShot: this.endsShot,
			honks: honks,
			secondsLeft: secondsLeft,
			shooting: this.state !== State.Idle,
			totalEnds: this.configuration.numberOfEnds,
		};
	}

	private addToDate(date?: Date, offsetInSeconds?: number): Date {
		date = date || new Date();
		offsetInSeconds = offsetInSeconds || 0;
		const result = new Date(date.valueOf());
		result.setSeconds(result.getSeconds() + offsetInSeconds);
		return result;
	}

	private isFirstGroupOfEnd(): boolean {
		if (this.configuration.alternatingShooters) {
			const isOddEnd = (this.endsShot % 2 === 1);
			return isOddEnd
				? this.currentShooters === 'C/D'
				: this.currentShooters === 'A/B';
		} else {
			return true;
		}
	}

	private getShootingTimeInSeconds(): number {
		return this.configuration.secondsPerArrow * this.configuration.arrowsPerEnd;
	}

	private switchShooters(): void {
		this.currentShooters = (this.currentShooters === 'A/B')
			? 'C/D'
			: 'A/B';
	}
}
