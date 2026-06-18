using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class ReleasePickupRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed record ReleasePickupResponse(
    OrderDetailsDto Order,
    IReadOnlyList<string> AllPickupNames
);

public sealed class ReleasePickupRequestValidator : Validator<ReleasePickupRequest>
{
    public ReleasePickupRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// Stop being a pickup for the day; clears the caller's IsPickup flag while the day is open (and
// vacates the collector designation if the caller was it). Authenticated.
public sealed class ReleasePickup : Endpoint<ReleasePickupRequest, ReleasePickupResponse>
{
    private readonly IPickupService pickupService;
    private readonly ICurrentUser currentUser;

    public ReleasePickup(IPickupService pickupService, ICurrentUser currentUser)
    {
        this.pickupService = pickupService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{DayId}/pickup/release");
    }

    public override async Task HandleAsync(ReleasePickupRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await pickupService.ReleaseAsync(
            new ReleasePickupCommand(callerId, req.DayId),
            ct
        );
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var value = result.Value;
        await Send.OkAsync(
            new ReleasePickupResponse(OrderDetailsMapper.ToDto(value.Order), value.AllPickupNames),
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
