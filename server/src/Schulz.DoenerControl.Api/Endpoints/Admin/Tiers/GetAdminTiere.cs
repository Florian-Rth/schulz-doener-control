using FastEndpoints;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Tiers;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Tiers;

public sealed record AdminTierDefinitionDto(
    string Emoji,
    string Name,
    string Tagline,
    IReadOnlyList<string> Tags,
    string Condition
);

public sealed record GetAdminTiereResponse(
    int WindowDays,
    IReadOnlyList<AdminTierDefinitionDto> Tiers
);

// Read-only admin inspector for the 15 Döner-Tier definitions (B4): lists every tier in priority
// order with its calculator-derived German trigger condition and the rolling window length the
// tiers are computed over. Nothing is editable — the thresholds stay in code. Admin-only.
public sealed class GetAdminTiere : EndpointWithoutRequest<GetAdminTiereResponse>
{
    private readonly ITierService tierService;

    public GetAdminTiere(ITierService tierService)
    {
        this.tierService = tierService;
    }

    public override void Configure()
    {
        Get("/api/admin/tiere");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = tierService.GetDefinitions();
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetAdminTiereResponse MapToResponse(TierDefinitionsDetails details) =>
        new(details.WindowDays, details.Tiers.Select(MapTier).ToList());

    private static AdminTierDefinitionDto MapTier(DoenerTier tier) =>
        new(tier.Emoji, tier.Name, tier.Tagline, tier.Tags, tier.Condition);
}
