type Direction = 'in' | 'out' | 'high' | 'low';
type DirectionResult = 'in' | 'out';
type Edge = 'none' | 'rising' | 'falling' | 'both';
type Value = 0 | 1;

interface IGpioOptions {
	debounceTimeout?: number;
	activeLow?: boolean;
	reconfigureDirection?: boolean;
}

// Windows mock for dev
class Gpio {
	public static accessible: boolean = false;
	public static HIGH: Value = 1;
	public static LOW: Value = 0;

	constructor(gpio: number, direction: Direction, /* edge?: Edge, */ options?: IGpioOptions) {
		// do nothing
	}

	public read(cb: (err: Error, value: Value) => void): void {
		// do nothing
	}
	public readSync(): Value { return null; }

	public write(value: Value, cb?: (err: Error) => void): void {
		// do nothing
	}
	public writeSync(value: Value): void {
		// do nothing
	}

	public watch(cb: (err: Error, value: Value) => void): void {
		// do nothing
	}

	public unwatch(cb?: (err: Error, value: Value) => void): void {
		// do nothing
	}
	public unwatchAll(): void {
		// do nothing
	}

	public direction(): DirectionResult { return null; }
	public setDirection(value: DirectionResult): void {
		// do nothing
	}

	public edge(): Edge { return null; }
	public setEdge(value: Edge): void {
		// do nothing
	}

	public activeLof(): boolean { return false; }
	public setActiveLow(invert: boolean): void {
		// do nothing
	}

	public unexport(): void {
		// do nothing
	}
}

const GpioImpl: typeof Gpio = (process.platform === 'win32')
	? Gpio
	: require('onoff').Gpio; // tslint:disable-line

export { Gpio, GpioImpl };
