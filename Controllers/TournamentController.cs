using BscAmpel.Models.Logic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace BscAmpel.Controllers
{
	[ApiController, Route("api/v1/[controller]")]
	public class TournamentController: ControllerBase
	{
		private readonly ILogger _logger;
		private readonly Tournament _tournament;

		public TournamentController(ILogger<TournamentController> logger, Tournament tournament)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_tournament = tournament ?? throw new System.ArgumentNullException(nameof(tournament));
		}

		[HttpGet]
		public ActionResult Get()
		{
			return Ok(_tournament.CanConfigure);
		}

		[HttpPost("start")]
		public ActionResult StartEnd()
		{
			_tournament.StartEnd();
			return Ok();
		}

		[HttpPost("stop")]
		public ActionResult StopEnd()
		{
			_tournament.EndCurrentEnd();
			return Ok();
		}
	}
}
