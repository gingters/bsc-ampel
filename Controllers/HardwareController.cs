using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BscAmpel.Services;

namespace BscAmpel.Controllers
{
	[ApiController, Route("api/v1/[controller]")]
	public class HardwareController: ControllerBase
	{
		private readonly ILogger _logger;
		private readonly HardwareService _hardware;

		public HardwareController(ILogger<HardwareController> logger, HardwareService hardware)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_hardware = hardware ?? throw new System.ArgumentNullException(nameof(hardware));
		}

		[HttpGet]
		public IActionResult Get()
		{
			return Ok(_hardware.GetState());
		}

		[HttpPost("startTest")]
		public IActionResult StartTest()
		{
			_hardware.ToggleTestMode(true);
			return Ok();
		}

		[HttpPost("stopTest")]
		public IActionResult StopTest()
		{
			_hardware.ToggleTestMode(false);
			return Ok();
		}

		[HttpPost("testPin")]
		public IActionResult TestPin([FromQuery] int pin, [FromQuery] bool value)
		{
			if (!_hardware.IsInTestMode)
			{
				return new StatusCodeResult(412); // Http 412: Precondition failed (in this case, testmode)
			}

			return _hardware.TogglePin(pin, value)
				? (IActionResult) Ok()
				: (IActionResult) NotFound();
		}

	}
}
