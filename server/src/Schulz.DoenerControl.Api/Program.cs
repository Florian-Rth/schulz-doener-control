using FastEndpoints;
using FastEndpoints.Swagger;
using Schulz.DoenerControl.Application;
using Schulz.DoenerControl.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddFastEndpoints();

if (builder.Environment.IsDevelopment())
{
    builder.Services.SwaggerDocument();
}

var app = builder.Build();

// The integration-test harness owns migration + seeding (it controls the isolated SQLite
// file per fixture); auto-migrating here too would race it. Everywhere else, migrate + seed
// on startup so the app is ready to serve.
if (!app.Environment.IsEnvironment("Testing"))
{
    await app.Services.MigrateAndSeedAsync(seedDevHistory: app.Environment.IsDevelopment());
}

app.UseFastEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.Run();

public partial class Program;
