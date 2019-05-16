using System;
using System.Threading;
using System.Threading.Tasks;
using BscAmpel.Hubs;
using BscAmpel.Models.Logic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BscAmpel.Services
{
	public class TournamentService : IHostedService
	{
		private readonly ILogger _logger;
		private readonly Tournament _tournament;
		private readonly IHubContext<TournamentHub> _tournamentHub;
		private readonly HardwareService _hardwareController;
		private readonly CancellationTokenSource _cts;

		public TournamentService(ILogger<TournamentService> logger, Tournament tournament, IHubContext<TournamentHub> tournamentHub, HardwareService hardwareController)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_tournament = tournament ?? throw new System.ArgumentNullException(nameof(tournament));
			_tournamentHub = tournamentHub ?? throw new System.ArgumentNullException(nameof(tournamentHub));
			_hardwareController = hardwareController ?? throw new ArgumentNullException(nameof(hardwareController));

			_cts = new CancellationTokenSource();
		}

		public Task StartAsync(CancellationToken cancellationToken)
		{
			_logger.LogInformation("Starting {Service}", nameof(TournamentService));

			DoTournament(_cts.Token);

			return Task.CompletedTask;
		}

		public Task StopAsync(CancellationToken cancellationToken)
		{
			_logger.LogInformation("Stopping {Service}", nameof(TournamentService));

			_cts.Cancel(false);

			return Task.CompletedTask;
		}

		public async Task DoTournament(CancellationToken cancellationToken)
		{
			_logger.LogInformation("Entering tournmanet loop.");

			while (!cancellationToken.IsCancellationRequested)
			{
				var newState = _tournament.Tick();

				await _tournamentHub.Clients.All.SendAsync("update", newState);
				_hardwareController.Update(newState);

				await Task.Delay(TimeSpan.FromMilliseconds(100));
			}

			_logger.LogInformation("Left tournmanet loop.");
		}
	}
}
