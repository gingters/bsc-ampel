using System;
using BscAmpel.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BscAmpel.Models.Logic
{
	public class Tournament
	{
		private readonly ILogger _logger;
		private TournamentOptions _configuration;


		// Values for running the tournament
		private DateTime? _start;
		private Group _currentGroup;
		private int _endsShot;

		// helper variables, not actually necessary, but they do help a lot
		private RoundState _state = RoundState.Idle;
		private Light _light = Light.Red;

		public Tournament(ILogger<Tournament> logger, IOptions<TournamentOptions> tournamentOptions)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_configuration = tournamentOptions?.Value ?? throw new System.ArgumentNullException(nameof(tournamentOptions));

			_logger.LogInformation("Tournament initialized with config {@Options}", _configuration);
			InitializeState();
		}

		public bool CanConfigure => (_start == null) && (_endsShot == 0);
		public void Configure(TournamentOptions newOptions)
		{
			_logger.LogDebug("{Method} has been called", nameof(Configure));

			if (newOptions == null) throw new ArgumentNullException(nameof(newOptions));
			if (!CanConfigure) throw new InvalidOperationException("Configuration can only be changed when idle.");

			_configuration = newOptions;
			InitializeState();
		}

		public void StartEnd(DateTime? now = null)
		{
			_logger.LogDebug("{Method} has been called", nameof(StartEnd));

			_start = now ?? DateTime.UtcNow;
		}

		public void EndCurrentEnd(DateTime? now = null)
		{
			_logger.LogDebug("{Method} has been called", nameof(EndCurrentEnd));

			if (_start == null)
				return;

			now = now ?? DateTime.UtcNow;

			var waitTime = _configuration.WaitTime;
			var shootingTime = _configuration.ShootingTime;

			var shootingEnd = IsFirstGroupdOfEnd()
				? _start.Value + waitTime + shootingTime
				: _start.Value + 2* waitTime + 2* shootingTime;

			var remainingWaitingTime = now - shootingEnd;
			if (remainingWaitingTime > TimeSpan.FromSeconds(1))
			{
				// cheat, and set back start date to what we calculated
				_start = _start.Value - remainingWaitingTime;
			}
		}

		public void Reset()
		{
			_logger.LogDebug("{Method} has been called", nameof(Reset));

			EndCurrentEnd();
			InitializeState();
		}

		// This is intended to be called *at least* a few times per second
		public TournamentState Tick(DateTime? now = null)
		{
			now = now ?? DateTime.UtcNow;

			switch (_state)
			{
				case RoundState.Idle: return HandleIdleState(now.Value);
				case RoundState.Waiting: return HandleWaitingState(now.Value);
				case RoundState.Shooting: return HandleShootingState(now.Value);
				default: throw new InvalidOperationException("Unknown state");
			}
		}

		private TournamentState HandleIdleState(DateTime now)
		{
			if (now >= _start)
			{
				_logger.LogInformation("Round start");

				// end has started, so change state
				_state = RoundState.Waiting;
				_logger.LogInformation("State changed from {StartState} to {TargetState}", RoundState.Idle, RoundState.Waiting);

				// Waiting is start of preparation phase, so we need to honk 2 times
				return GetCurrentState(_configuration.WaitTime, 2);
			}

			// else we're still idling
			return GetCurrentState();
		}

		// we only need to check if waiting is over
		private TournamentState HandleWaitingState(DateTime now)
		{
			var waitingEnd = IsFirstGroupdOfEnd()
				? _start.Value + _configuration.WaitTime
				: _start.Value + 2* _configuration.WaitTime + _configuration.ShootingTime;

			if (now <= waitingEnd)
			{
				// we're still waiting, so wait
				return GetCurrentState(waitingEnd - now);
			}
			else
			{
				// waiting is over, so start the shooting
				_state = RoundState.Shooting;
				_logger.LogInformation("State changed from {StartState} to {TargetState}", RoundState.Waiting, RoundState.Shooting);

				_light = Light.Green;
				_logger.LogInformation("Light changed from {StartLight} to {TargetLight}", Light.Red, Light.Green);

				// we started shooting: Honk once
				return GetCurrentState(_configuration.ShootingTime, 1);
			}
		}

		private TournamentState HandleShootingState(DateTime now)
		{
			var waitTime = _configuration.WaitTime;
			var isFirstGroup = IsFirstGroupdOfEnd();

			var shootingEnd = isFirstGroup
				? _start.Value + _configuration.WaitTime + _configuration.ShootingTime
				: _start.Value + 2* _configuration.WaitTime + 2* _configuration.ShootingTime;

			if (now <= shootingEnd)
			{
				// we're still shooting

				// check if we need to switch to yellow
				var remainingTime = shootingEnd - now;
				if ((_light != Light.Yellow) && (remainingTime <= _configuration.YellowPhase))
				{
					_logger.LogInformation("Entering yellow phase");
					_light = Light.Yellow;
					_logger.LogInformation("Light changed from {StartLight} to {TargetLight}", Light.Green, Light.Yellow);
				}

				return GetCurrentState(remainingTime);
			}
			else
			{
				_logger.LogInformation("Shooting time is over");

				// shooting is over. Check if we need to switch groups and continue or stop the end
				if (_configuration.AlternatingShooters && isFirstGroup)
				{
					_logger.LogInformation("Was first group and have more, so go to other group");

					// start 2nd round, honk twice
					_state = RoundState.Waiting;
					_logger.LogInformation("State changed from {StartState} to {TargetState}", RoundState.Shooting, RoundState.Waiting);

					SwitchGroups();

					_light = Light.Red;
					_logger.LogInformation("Light changed from {StartLight} to {TargetLight}", Light.Yellow, Light.Red);

					return GetCurrentState(_configuration.WaitTime, 2);
				}
				else
				{
					_logger.LogInformation("Was second group or only have one, so end this end.");

					// either, we only have one group, or we finished for second group of shooters, so end round
					_state = RoundState.Idle;
					_logger.LogInformation("State changed from {StartState} to {TargetState}", RoundState.Shooting, RoundState.Idle);

					_start = null;

					_light = Light.Red;
					_logger.LogInformation("Light changed from {StartLight} to {TargetLight}", Light.Yellow, Light.Red);

					_endsShot += 1;
					_logger.LogInformation("Number of ends shot: {NumberOfEnds}", _endsShot);


					if (_endsShot >= _configuration.NumberOfEnds)
					{
						_endsShot = 0;
						_logger.LogInformation("Tournament finished. Resetting number of ends shot: {NumberOfEnds}", _endsShot);
					}

					// End round = 3 honks
					return GetCurrentState(null, 3);
				}
			}
		}

		private bool IsFirstGroupdOfEnd()
		{
			if (!_configuration.AlternatingShooters)
				return true;

			// We record only complete ends shot. So _endsShot is BEHIND by 1 (i.e. still 0 while shooting the FIRST end)
			// So, if we have an even number in _endsShot (0, 2, 4...) we're starting with A/B shooters,
			// if we have an odd number (1, 3, 5...) this round starts with the C/D shooter group

			return ((_endsShot % 2 == 0)) // this tests for an even number
				? _currentGroup == Group.First
				: _currentGroup == Group.Second;
		}

		private void SwitchGroups()
		{
			if (_currentGroup == Group.First)
			{
				_currentGroup = Group.Second;
				_logger.LogInformation("Group changed from {StartGroup} to {TargetGroup}", Group.First, Group.Second);
			}
			else
			{
				_currentGroup = Group.First;
				_logger.LogInformation("Group changed from {StartGroup} to {TargetGroup}", Group.Second, Group.First);
			}
		}

		private TournamentState GetCurrentState(TimeSpan? timeLeft = null, int? honks = null)
		{
			return new TournamentState()
			{
				CurrentLight = _light,
				FirstGroup = _currentGroup == Group.First,
				EndsShot = _endsShot,
				TotalEnds = _configuration.NumberOfEnds,
				TimeLeft = timeLeft,
				Honks = honks ?? 0,
			};
		}

		private void InitializeState()
		{
			_state = RoundState.Idle;
			_light = Light.Red;
			_start = null;
			_currentGroup = Group.First;
			_endsShot = 0;
		}
	}
}
