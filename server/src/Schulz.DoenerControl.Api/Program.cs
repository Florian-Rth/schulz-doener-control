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

app.UseFastEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.Run();

public partial class Program;
