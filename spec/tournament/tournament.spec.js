describe('Tournament', () => {
	const Tournament = require('../../dist/tournament').Tournament;
	let tournament = new Tournament();

	beforeEach(() => {
		tournament = new Tournament();
	});

	it('should start initialized', () => {
		expect(tournament.endsShot).toEqual(0);
		expect(tournament.state).toEqual(0); // State.Idle
		expect(tournament.currentShooters).toEqual('A/B');
		expect(tournament.endStart).toEqual(null);
		expect(tournament.currentLight).toEqual('red');
	});

	describe('startEnd', () => {
		it('should set the start time of the next end', () => {
			const now = new Date();
			tournament.startEnd(now);

			expect(tournament.endStart).toEqual(now);
		});
	});

	describe('tick', () => {
		it('should return idle state', () => {
			const state = tournament.tick();

			expect(state.currentLight).toEqual('red');
			expect(state.currentShooters).toEqual('A/B');
			expect(state.endsShot).toEqual(0);
			expect(state.totalEnds).toEqual(20);
			expect(state.secondsLeft).toEqual(null);
			expect(state.honks).toEqual(0);
		});

		it('should not change state in idle state for a long time', () => {
			const date = new Date();
			date.setMinutes(date.getMinutes() + 120); // add two hours
			const state = tournament.tick();

			expect(state.currentLight).toEqual('red');
			expect(state.currentShooters).toEqual('A/B');
			expect(state.endsShot).toEqual(0);
			expect(state.totalEnds).toEqual(20);
			expect(state.secondsLeft).toEqual(null);
			expect(state.honks).toEqual(0);
		});

		describe('waiting phase', () => {
			const date = new Date();

			beforeEach(() => {
				tournament.startEnd(date);
			});

			it('should start with first tick after startEnd', () => {
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('red');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.waitTimeInSeconds);
				expect(state.honks).toEqual(2);
			});

			it('should update waiting time correctly', () => {
				tournament.tick(date);

				date.setSeconds(date.getSeconds() + 15);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('red');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.waitTimeInSeconds - 15);
				expect(state.honks).toEqual(0);
			});

			it('should last configured wait time to max', () => {
				tournament.tick(date);

				date.setSeconds(date.getSeconds() + tournament.configuration.waitTimeInSeconds);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('red');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(0); // exact zero at this tick
				expect(state.honks).toEqual(0);
			});

			it('should switch state to shooting at end of waiting time', () => {
				tournament.tick(date);

				// 1 millisecond over waiting time is switch time
				date.setMilliseconds(date.getMilliseconds() + tournament.configuration.waitTimeInSeconds * 1000 + 1);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('green');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.secondsPerArrow * tournament.configuration.arrowsPerEnd);
				expect(state.honks).toEqual(1);
			});
		});

		describe('shooting phase', () => {
			const date = new Date();
			const shootingTime = tournament.configuration.arrowsPerEnd * tournament.configuration.secondsPerArrow;

			beforeEach(() => {
				// fast forward into shooting phase
				tournament.startEnd(date); // start end
				tournament.tick(date); // tick into waiting phase
				date.setMilliseconds(date.getMilliseconds() + tournament.configuration.waitTimeInSeconds * 1000 + 1);
				tournament.tick(date); // tick into shooting phase

				// remove the tipping millisecond again
				date.setMilliseconds(date.getMilliseconds() -1);
			});

			it('should not switch to yellow too early', () => {
				date.setMilliseconds(date.getMilliseconds() + (shootingTime - tournament.configuration.yellowPhaseInSeconds) * 1000 - 1);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('green');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.yellowPhaseInSeconds + 1);
				expect(state.honks).toEqual(0);
			});

			it('should switch to yellow', () => {
				date.setSeconds(date.getSeconds() + shootingTime - tournament.configuration.yellowPhaseInSeconds);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('yellow');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.yellowPhaseInSeconds);
				expect(state.honks).toEqual(0);
			});

			it('should last configured shooting time (up to max)', () => {
				date.setSeconds(date.getSeconds() + shootingTime);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('yellow');
				expect(state.currentShooters).toEqual('A/B');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(0); // exact zero at this tick
				expect(state.honks).toEqual(0);
			});

			it('should switch state to waiting at end of shooting time', () => {
				// 1 millisecond over shooting time is switch time
				date.setMilliseconds(date.getMilliseconds() + shootingTime * 1000 + 1);
				const state = tournament.tick(date);

				expect(state.currentLight).toEqual('red');
				expect(state.currentShooters).toEqual('C/D');
				expect(state.endsShot).toEqual(0);
				expect(state.totalEnds).toEqual(20);
				expect(state.secondsLeft).toEqual(tournament.configuration.waitTimeInSeconds);
				expect(state.honks).toEqual(2);
			});

		});
	});
});