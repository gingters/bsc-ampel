using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BscAmpel
{
	public class Program
	{
		public static async Task<int> Main(string[] args)
		{
			try
			{
				await CreateHostBuilder(args).Build().RunAsync();
			}
			catch (Exception ex)
			{
				Console.WriteLine("A fatal error occured. Service crashed. " + ex.Message);
				return 1;
			}
			finally
			{
			}

			return 0;
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
			.ConfigureWebHostDefaults(webBuilder =>
			{
				webBuilder.UseStartup<Startup>();
			});
	}
}
