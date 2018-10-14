import { EventEmitter } from 'events';
import { Tournament } from './tournament';

export class TournamentRunner extends EventEmitter {
	private readonly tickInterval = 100;
	private ticker: number = null;

	constructor(private tournament: Tournament) {
		super();
	}

	public start(): void {
		this.ticker = setInterval(() => this.tick(), this.tickInterval) as any;
	}

	public stop(): void {
		if (this.ticker !== null) {
			clearInterval(this.ticker);
			this.ticker = null;
		}
	}

	private tick(): void {
		const state = this.tournament.tick();
		this.emit('state-update', state);
	}
}
