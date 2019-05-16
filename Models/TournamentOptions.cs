using System;
using Newtonsoft.Json;

namespace BscAmpel.Models
{
	public class TournamentOptions
	{
		public TimeSpan WaitTime { get; set; } = TimeSpan.FromSeconds(10);
		public int ArrowsPerEnd { get; set; } = 3;
		public TimeSpan TimePerArrow { get; set; } = TimeSpan.FromSeconds(20);
		public TimeSpan YellowPhase { get; set; } = TimeSpan.FromSeconds(30);
		public int NumberOfEnds { get; set; } = 20;
		public bool AlternatingShooters { get; set; } = true;

		[JsonIgnore]
		public TimeSpan ShootingTime => ArrowsPerEnd * TimePerArrow;
	}
}
