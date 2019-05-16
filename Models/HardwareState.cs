namespace BscAmpel.Models
{
	public class HardwareState
	{
		public bool TestMode { get; set; }
		public bool Red { get; set; }
		public bool Yellow { get; set; }
		public bool Green { get; set; }
		public bool FirstGroup { get; set; }
		public bool SecondGroup { get; set; }
		public bool Honk { get; set; }
	}
}
