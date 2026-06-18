using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class ClaimPickupRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed record ClaimPickupResponse(
    OrderDetailsDto Order,
    IReadOnlyList<string> AllPickupNames
);

public sealed class ClaimPickupRequestValidator : Validator<ClaimPickupRequest>
{
    public ClaimPickupRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// "Ich hole heute ab" — flips the caller's existing order to pickup. The caller must already have an
// order on an open day. Authenticated.
public sealed class ClaimPickup : Endpoint<ClaimPickupRequest, ClaimPickupResponse>
{
    private readonly IPickupService pickupService;
    private readonly ICurrentUser currentUser;

    public ClaimPickup(IPickupService pickupService, ICurrentUser currentUser)
    {
        this.pickupService = pickupService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{DayId}/pickup/claim");
    }

    public override async Task HandleAsync(ClaimPickupRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await pickupService.ClaimAsync(
            new ClaimPickupCommand(callerId, req.DayId),
            ct
        );
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var value = result.Value;
        await Send.OkAsync(
            new ClaimPickupResponse(OrderDetailsMapper.ToDto(value.Order), value.AllPickupNames),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
