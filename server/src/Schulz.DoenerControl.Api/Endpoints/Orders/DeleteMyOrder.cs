using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class DeleteMyOrderRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed class DeleteMyOrderRequestValidator : Validator<DeleteMyOrderRequest>
{
    public DeleteMyOrderRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// Withdraws the caller's order from a day (before cutoff while open). Returns 204. Authenticated.
public sealed class DeleteMyOrder : Endpoint<DeleteMyOrderRequest>
{
    private readonly IOrderService orderService;
    private readonly ICurrentUser currentUser;

    public DeleteMyOrder(IOrderService orderService, ICurrentUser currentUser)
    {
        this.orderService = orderService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Delete("/api/order-days/{DayId}/orders/mine");
    }

    public override async Task HandleAsync(DeleteMyOrderRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderService.DeleteMineAsync(
            new DeleteOrderCommand(callerId, req.DayId),
            ct
        );

        if (!result.IsSuccess)
        {
            switch (result.Status)
            {
                case Core.ResultStatus.NotFound:
                    await Send.NotFoundAsync(ct);
                    break;
                case Core.ResultStatus.Conflict:
                    await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                    break;
                default:
                    await Send.ErrorsAsync(cancellation: ct);
                    break;
            }
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
