using System.Threading.Tasks;
using BscAmpel.Models;
using BscAmpel.Models.Logic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace BscAmpel.Hubs
{
	public class TournamentHub: Hub
	{
		private readonly ILogger _logger;
		private readonly Tournament _tournament;

		public TournamentHub(ILogger<TournamentHub> logger, Tournament tournament)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_tournament = tournament ?? throw new System.ArgumentNullException(nameof(tournament));
		}

		public Task ConfigureTournament(TournamentOptions options)
		{

			return Task.CompletedTask;
		}
	}
}
