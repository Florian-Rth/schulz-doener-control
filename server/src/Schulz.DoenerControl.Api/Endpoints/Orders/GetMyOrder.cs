using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class GetMyOrderRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed record GetMyOrderResponse(bool HasOrder, OrderDetailsDto? Order);

public sealed class GetMyOrderRequestValidator : Validator<GetMyOrderRequest>
{
    public GetMyOrderRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// Returns the caller's own order for a day to prefill the order screen on edit; HasOrder=false when
// the caller has not ordered yet. Authenticated.
public sealed class GetMyOrder : Endpoint<GetMyOrderRequest, GetMyOrderResponse>
{
    private readonly IOrderService orderService;
    private readonly ICurrentUser currentUser;

    public GetMyOrder(IOrderService orderService, ICurrentUser currentUser)
    {
        this.orderService = orderService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/order-days/{DayId}/orders/mine");
    }

    public override async Task HandleAsync(GetMyOrderRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderService.GetMineAsync(new GetMyOrderQuery(callerId, req.DayId), ct);
        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var order = result.Value;
        var response = order is null
            ? new GetMyOrderResponse(false, null)
            : new GetMyOrderResponse(true, OrderDetailsMapper.ToDto(order));

        await Send.OkAsync(response, cancellation: ct);
    }
}
