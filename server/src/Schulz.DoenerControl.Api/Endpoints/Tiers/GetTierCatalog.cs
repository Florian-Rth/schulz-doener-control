using FastEndpoints;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Tiers;

namespace Schulz.DoenerControl.Api.Endpoints.Tiers;

public sealed record TierCatalogEntrySummaryDto(
    string Emoji,
    string Name,
    string Tagline,
    IReadOnlyList<string> Tags,
    bool IsMine
);

// The full 15-Tier catalogue in priority order (PLAN F13), with the caller's own derived tier
// flagged via IsMine so the catalogue screen can badge it. Returned as a bare array (PLAN #24 — the
// FE TierCatalogSchema is a z.array), so the response IS the list, with no wrapper object.
// Authenticated.
public sealed class GetTierCatalog
    : EndpointWithoutRequest<IReadOnlyList<TierCatalogEntrySummaryDto>>
{
    private readonly ITierService tierService;
    private readonly ICurrentUser currentUser;

    public GetTierCatalog(ITierService tierService, ICurrentUser currentUser)
    {
        this.tierService = tierService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/tiere");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await tierService.GetCatalogAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static IReadOnlyList<TierCatalogEntrySummaryDto> MapToResponse(
        TierCatalogDetails details
    ) => details.Entries.Select(MapEntry).ToList();

    private static TierCatalogEntrySummaryDto MapEntry(TierCatalogEntryDetails entry) =>
        new(entry.Tier.Emoji, entry.Tier.Name, entry.Tier.Tagline, entry.Tier.Tags, entry.IsMine);
}
