import { EventEmitter } from 'events';
import { TimedEvent } from './timedEvent';

export class EventPump extends EventEmitter {

	private readonly pumpInterval = 25;

	private pumper: number = null;
	private events: TimedEvent[] = [];

	public start(): void {
		this.pumper = setInterval(() => this.pump(), this.pumpInterval) as any;
	}

	public stop(): void {
		if (this.pumper !== null) {
			clearInterval(this.pumper);
			this.pumper = null;
		}
	}

	public enqueueEvents(events: TimedEvent[]): void {
		events.forEach((value) => {
			this.enqueueEvent(value);
		});
	}

	public enqueueEvent<TPayload>(event: TimedEvent): void {
		this.events.splice(this.locationOf(event, this.events, this.timedEventComparer) + 1, 0, event);
	}

	public clearQueue() {
		this.events = [];
	}

	// Todo: Move this out of here. Comparing timed events don't belong in the event pump
	private timedEventComparer(a: TimedEvent, b: TimedEvent): number {
		if (a.time < b.time) { return -1; }
		if (a.time > b.time) { return 1; }
		return 0;
	}

	// Todo: Move this out of there. Inserting in an array in a sorted manner doesn't belong in the event pump
	private locationOf<T>(elem: T, array: T[], com: (a: T, b: T) => number, start?: number, end?: number): number {
		if (array.length === 0) {
			return -1;
		}

		start = start || 0;
		end = end || array.length;
		// tslint:disable-next-line
		const pivot = (start + end) >> 1; // should be faster than division by 2

		const c = com(elem, array[pivot]);
		if (end - start <= 1) {
			return (c === -1) ? (pivot - 1) : pivot;
		}

		switch (c) {
			case -1: return this.locationOf(elem, array, com, start, pivot);
			case 0 : return pivot;
			case 1: return this.locationOf(elem, array, com, pivot, end);
			default: {
				throw new Error('Comparer returned unexpected value');
			}
		}
	};

	private pump(): void {
		const now = new Date();
		while (this.peekAndRaiseEvent(now)) {
			// do nothing, peek does the job
		}
	}

	private peekAndRaiseEvent(time: Date): boolean {
		if ((this.events.length > 0) && (this.events[0].time < time)) {
			this.raiseNextEvent();
			return true;
		}

		return false;
	}

	private raiseNextEvent(): void {
		const event = this.events.shift();
		this.emit(event.type, event.payload);
	}
}
