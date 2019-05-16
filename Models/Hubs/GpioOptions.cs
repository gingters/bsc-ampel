using System;

namespace BscAmpel.Models
{
	public class GpioOptions
	{
		public int RedLight { get; set; } = 5;
		public int YellowLight { get; set; } = 6;
		public int GreenLight { get; set; } = 12;
		public int FirstGroup { get; set; } = 13;
		public int SecondGroup { get; set; } = 16;
		public int Honk { get; set; } = 17;

		public int Receiver { get; set; } = 27;
		public TimeSpan HonkLength { get; set; } = TimeSpan.FromMilliseconds(500);
		public TimeSpan HonkPause { get; set; } = TimeSpan.FromMilliseconds(250);
		public bool ActiveLow { get; set; } = false;
	}
}
