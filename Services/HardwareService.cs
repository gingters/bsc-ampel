using System;
using System.Linq;
using System.Threading.Tasks;
using BscAmpel.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Unosquare.RaspberryIO;
using Unosquare.RaspberryIO.Abstractions;

namespace BscAmpel.Services
{
	public class HardwareService : IDisposable
	{
		private readonly ILogger _logger;
		private readonly GpioOptions _configuration;

		private readonly IGpioPin _red;
		private readonly IGpioPin _yellow;
		private readonly IGpioPin _green;
		private readonly IGpioPin _firstGroup;
		private readonly IGpioPin _secondGroup;
		private readonly IGpioPin _honk;
		private IGpioPin[] _allPins;

		public bool IsInTestMode { get; private set;}

		public HardwareService(ILogger<HardwareService> logger, IOptions<GpioOptions> options)
		{
			_logger = logger ?? throw new System.ArgumentNullException(nameof(logger));
			_configuration = options?.Value ?? throw new System.ArgumentNullException(nameof(options));

			// Initialize Pins
			_logger.LogInformation("Initializing hardware controller with config {@Options}", _configuration);

			_red = InitializeOutputPin(_configuration.RedLight);
			_yellow = InitializeOutputPin(_configuration.YellowLight);
			_green = InitializeOutputPin(_configuration.GreenLight);
			_firstGroup = InitializeOutputPin(_configuration.FirstGroup);
			_secondGroup = InitializeOutputPin(_configuration.SecondGroup);
			_honk = InitializeOutputPin(_configuration.Honk);

			_allPins = new [] { _red, _yellow, _green, _firstGroup, _secondGroup, _honk, };
		}

		public void ToggleTestMode(bool testMode)
		{
			_logger.LogInformation($"Changing testmode on {nameof(HardwareService)} to {{OnOff}}", testMode);
			IsInTestMode = testMode;

			if (IsInTestMode)
			{
				foreach(var pin in _allPins)
				{
					pin.Value = Off;
				}
			}
		}

		public HardwareState GetState()
		{
			return new HardwareState()
			{
				TestMode = IsInTestMode,
				Red = _red.Value,
				Yellow = _yellow.Value,
				Green = _yellow.Value,
				FirstGroup = _firstGroup.Value,
				SecondGroup = _secondGroup.Value,
				Honk = _honk.Value,
			};
		}

		public bool TogglePin(int pinNo, bool value)
		{
			if (!IsInTestMode) return false;

			var pin = _allPins.SingleOrDefault(p => p.BcmPinNumber == pinNo);

			if (pin != null)
			{
				pin.Value = OnOff(value);
				return true;
			}

			return false;
		}

		public void Update(TournamentState newState)
		{
			if (IsInTestMode) return;

			Task.Run(() => {
				_red.Value = OnOff(newState.CurrentLight == Light.Red);
				_yellow.Value = OnOff(newState.CurrentLight == Light.Yellow);
				_green.Value = OnOff(newState.CurrentLight == Light.Green);

				_firstGroup.Value = OnOff(newState.FirstGroup);
				_secondGroup.Value = OnOff(!newState.FirstGroup);

				DoHonk(newState.Honks);
			});
		}

		private async Task DoHonk(int honks)
		{
			for (var i = 0; i < honks; i++)
			{
				_logger.LogInformation("Honking {x} of {y} times", i+1, honks);

				if (i > 0) {
					_logger.LogDebug("Honker waiting for {HonkPause}", _configuration.HonkPause);
					await Task.Delay(_configuration.HonkPause);
				}

				_logger.LogDebug("Honker turning {OnOff} honk and waiting for {HonkLength}", true, _configuration.HonkLength);
				_honk.Value = On;
				await Task.Delay(_configuration.HonkLength);
				_logger.LogDebug("Honker turning {OnOff} honk", false);
				_honk.Value = Off;
			}
		}

		private IGpioPin InitializeOutputPin(int bcmValue)
		{
			var pin = Pi.Gpio[bcmValue];
			pin.PinMode = GpioPinDriveMode.Output;
			pin.Value = Off;

			return pin;
		}

		private bool On => !_configuration.ActiveLow;

		private bool Off => _configuration.ActiveLow;

		private bool OnOff(bool value)
		{
			return value ? On : Off;
		}

		#region IDisposable Support
		private bool disposedValue = false; // To detect redundant calls

		protected virtual void Dispose(bool disposing)
		{
			if (!disposedValue)
			{
				if (disposing)
				{
					_logger.LogInformation("Disposing, so turning off the lights.");

					// Der Letzte macht das Licht aus
					foreach(var pin in _allPins)
					{
						pin.Value = Off;
					}
				}

				// TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
				// TODO: set large fields to null.

				disposedValue = true;
			}
		}

		// TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
		// ~HardwareController()
		// {
		//   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
		//   Dispose(false);
		// }

		// This code added to correctly implement the disposable pattern.
		public void Dispose()
		{
			// Do not change this code. Put cleanup code in Dispose(bool disposing) above.
			Dispose(true);
			// TODO: uncomment the following line if the finalizer is overridden above.
			// GC.SuppressFinalize(this);
		}
		#endregion
	}
}

