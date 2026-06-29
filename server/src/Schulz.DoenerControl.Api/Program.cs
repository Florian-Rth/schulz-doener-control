using FastEndpoints;
using FastEndpoints.Swagger;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application;
using Schulz.DoenerControl.Infrastructure;

// QuestPDF Community licence (free under the QuestPDF revenue threshold) — must be set before the
// first PDF is generated, or QuestPDF throws. Internal office tool; well within the threshold.
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddDoenerAuth(builder.Configuration, builder.Environment);
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

app.UseCors(AuthSetup.CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.UseFastEndpoints(config =>
{
    config.Endpoints.Configurator = AuthPreProcessors.Apply;
});

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.Run();

public partial class Program;
