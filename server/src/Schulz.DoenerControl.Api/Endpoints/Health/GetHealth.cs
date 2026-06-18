using FastEndpoints;
using Schulz.DoenerControl.Application.Health;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Health;

public sealed record GetHealthResponse(string Status, string Version, DateTimeOffset CheckedAt);

public sealed class GetHealth : EndpointWithoutRequest<GetHealthResponse>
{
    private readonly IHealthService healthService;

    public GetHealth(IHealthService healthService)
    {
        this.healthService = healthService;
    }

    public override void Configure()
    {
        Get("/health");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = healthService.GetHealth();

        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var response = MapToResponse(result.Value);
        await Send.OkAsync(response, cancellation: ct);
    }

    private static GetHealthResponse MapToResponse(HealthDetails details) =>
        new(details.Status, details.Version, details.CheckedAt);
}
