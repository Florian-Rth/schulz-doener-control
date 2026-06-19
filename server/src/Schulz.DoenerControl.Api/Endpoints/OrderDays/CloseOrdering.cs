using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed class CloseOrderingRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record CloseOrderingResponse(OrderDayDetailsDto Day);

public sealed class CloseOrderingRequestValidator : Validator<CloseOrderingRequest>
{
    public CloseOrderingRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Manually locks ordering for a Döner-Tag ("Bestellung schließen") without closing the whole day:
// stamps OrderingClosedAt so no more orders, edits or pickups may be placed even before the time
// cutoff. Only the designated collector may do this (403 otherwise); debt generation still hangs off
// the separate close-day transition. Authenticated.
public sealed class CloseOrdering : Endpoint<CloseOrderingRequest, CloseOrderingResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public CloseOrdering(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{Id}/close-ordering");
    }

    public override async Task HandleAsync(CloseOrderingRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new CloseOrderingCommand(callerId, req.Id);
        var result = await orderDayService.CloseOrderingAsync(command, ct);

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var response = new CloseOrderingResponse(OrderDayDetailsMapper.ToDto(result.Value));
        await Send.OkAsync(response, cancellation: ct);
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Forbidden:
                await Send.ForbiddenAsync(ct);
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
