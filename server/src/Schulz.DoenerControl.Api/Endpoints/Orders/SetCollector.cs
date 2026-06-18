using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class SetCollectorRequest
{
    [RouteParam]
    public Guid DayId { get; set; }

    public Guid CollectorUserId { get; set; }
}

public sealed record SetCollectorResponse(OrderDayDetailsDto Day);

public sealed class SetCollectorRequestValidator : Validator<SetCollectorRequest>
{
    public SetCollectorRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
        RuleFor(request => request.CollectorUserId).NotEmpty();
    }
}

// Designates the single collector for a day (the person who pays the shop; every debt points to
// them). The designated user must already be a pickup on the day. Authenticated.
public sealed class SetCollector : Endpoint<SetCollectorRequest, SetCollectorResponse>
{
    private readonly IPickupService pickupService;
    private readonly ICurrentUser currentUser;

    public SetCollector(IPickupService pickupService, ICurrentUser currentUser)
    {
        this.pickupService = pickupService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{DayId}/collector");
    }

    public override async Task HandleAsync(SetCollectorRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new SetCollectorCommand(callerId, req.DayId, req.CollectorUserId);
        var result = await pickupService.SetCollectorAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new SetCollectorResponse(OrderDayDetailsMapper.ToDto(result.Value)),
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
