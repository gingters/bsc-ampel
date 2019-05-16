using System;

namespace BscAmpel
{
	public class TournamentState
	{
		public Light CurrentLight { get; set; } = Light.Red;
		public bool FirstGroup = true;
		public int EndsShot { get; set; }
		public int TotalEnds { get; set; }
		public string Group => FirstGroup ? "A/B" : "C/D";
		public TimeSpan? TimeLeft { get; set; }
		public int Honks { get; set; }
	}
}
