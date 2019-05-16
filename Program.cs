using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Unosquare.RaspberryIO;
using Unosquare.WiringPi;

namespace BscAmpel
{
	public class Program
	{
		public static async Task<int> Main(string[] args)
		{
			Log.Logger = new LoggerConfiguration()
				.MinimumLevel.Verbose()
				.Enrich.FromLogContext()
				.Enrich.WithProperty("Application", "Bsc-Ampel")
				.WriteTo.Console()
				.CreateLogger();

			try
			{
				// Initialize GPIO Controller library
				Pi.Init<BootstrapWiringPi>();

				await CreateHostBuilder(args).Build().RunAsync();
			}
			catch (Exception ex)
			{
				Console.WriteLine("A fatal error occured. Service crashed. " + ex.Message);
				return 1;
			}
			finally
			{
				Log.CloseAndFlush();
			}

			return 0;
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
			.ConfigureWebHostDefaults(webBuilder =>
			{
				webBuilder.UseKestrel(options => {
					options.ListenAnyIP(8080);
				})
				.ConfigureLogging(loggingBuilder =>
				{
					loggingBuilder.AddSerilog();
				})
				.UseStartup<Startup>()
				;
			})
			;
	}
}
