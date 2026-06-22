using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class ClaimCollectorRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed record ClaimCollectorResponse(OrderDayDetailsDto Day);

public sealed class ClaimCollectorRequestValidator : Validator<ClaimCollectorRequest>
{
    public ClaimCollectorRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// "Ich hole heute ab" — one dashboard action that both becomes the Abholer when nobody is and takes
// the role over from a colleague (they're in a meeting). The caller must already have an order on
// the open day. Intentionally open to any logged-in user so colleagues can take over. Authenticated.
public sealed class ClaimCollector : Endpoint<ClaimCollectorRequest, ClaimCollectorResponse>
{
    private readonly IPickupService pickupService;
    private readonly ICurrentUser currentUser;

    public ClaimCollector(IPickupService pickupService, ICurrentUser currentUser)
    {
        this.pickupService = pickupService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{DayId}/collector/claim");
    }

    public override async Task HandleAsync(ClaimCollectorRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new ClaimCollectorCommand(callerId, req.DayId);
        var result = await pickupService.ClaimCollectorAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new ClaimCollectorResponse(OrderDayDetailsMapper.ToDto(result.Value)),
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
