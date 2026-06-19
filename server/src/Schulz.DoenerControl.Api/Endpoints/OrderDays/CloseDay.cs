using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed class CloseDayRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record CloseDayResponse(OrderDayDetailsDto Day, int DebtsCreated);

public sealed class CloseDayRequestValidator : Validator<CloseDayRequest>
{
    public CloseDayRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Manually closes a Döner-Tag ("Tag schließen"): flips it to Closed and stamps ClosedAt. Returns how
// many debts the close created (the debt-generation feature hangs off this transition). Only the
// designated collector may close the day (403 otherwise). Authenticated.
public sealed class CloseDay : Endpoint<CloseDayRequest, CloseDayResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public CloseDay(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{Id}/close");
    }

    public override async Task HandleAsync(CloseDayRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new CloseDayCommand(callerId, req.Id);
        var result = await orderDayService.CloseAsync(command, ct);

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var value = result.Value;
        var response = new CloseDayResponse(
            OrderDayDetailsMapper.ToDto(value.Day),
            value.DebtsCreated
        );
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
