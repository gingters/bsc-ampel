using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BscAmpel.Hubs;
using BscAmpel.Models;
using BscAmpel.Models.Logic;
using BscAmpel.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BscAmpel
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services
				.Configure<TournamentOptions>(Configuration.GetSection("Tournament"))
				.Configure<GpioOptions>(Configuration.GetSection("Gpio"))
				.AddSingleton<Tournament>()
				.AddSingleton<HardwareService>()
				.AddHostedService<TournamentService>()
				.AddCors();

			services
				.AddSignalR();

			services
				.AddControllers()
				.AddNewtonsoftJson()
				;
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
			}

			app.UseStaticFiles();
			app.UseRouting();

			app.UseCors(builder => { builder.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin(); });
			app.UseEndpoints(endpoints => {
				endpoints.MapHub<TournamentHub>("/tournamentHub");
				endpoints.MapControllers();
			});
		}
	}
}
