using FastEndpoints;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Tiers;

namespace Schulz.DoenerControl.Api.Endpoints.Tiers;

public sealed record GetMyTierResponse(
    string Emoji,
    string Name,
    string Tagline,
    IReadOnlyList<string> Tags,
    int Count
);

// The caller's own Döner-Tier (PLAN F13), derived live from their last-90-days order history via
// the ported computeTier. Authenticated.
public sealed class GetMyTier : EndpointWithoutRequest<GetMyTierResponse>
{
    private readonly ITierService tierService;
    private readonly ICurrentUser currentUser;

    public GetMyTier(ITierService tierService, ICurrentUser currentUser)
    {
        this.tierService = tierService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/tiere/mine");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await tierService.GetMineAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetMyTierResponse MapToResponse(DoenerTier tier) =>
        new(tier.Emoji, tier.Name, tier.Tagline, tier.Tags, tier.Count);
}
