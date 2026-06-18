using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class GetOrderResultRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record AbholerDto(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalHandle
);

public sealed record GetOrderResultResponse(
    string ProductLabel,
    int PriceCents,
    string Detail,
    bool IsPickup,
    AbholerDto? Abholer,
    int CollectCents,
    int CollectCount,
    string? MyPayPalUrl
);

public sealed class GetOrderResultRequestValidator : Validator<GetOrderResultRequest>
{
    public GetOrderResultRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// The Success screen, server-driven from one order id: what the caller ordered, whether they're the
// pickup, who the Abholer is, and either their PayPal link to pay or the total they collect.
// The order must be the caller's own (else 404). Authenticated.
public sealed class GetOrderResult : Endpoint<GetOrderResultRequest, GetOrderResultResponse>
{
    private readonly IOrderService orderService;
    private readonly ICurrentUser currentUser;

    public GetOrderResult(IOrderService orderService, ICurrentUser currentUser)
    {
        this.orderService = orderService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/orders/{Id}/result");
    }

    public override async Task HandleAsync(GetOrderResultRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderService.GetResultAsync(
            new GetOrderResultQuery(callerId, req.Id),
            ct
        );
        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(ToResponse(result.Value), cancellation: ct);
    }

    private static GetOrderResultResponse ToResponse(OrderResultDetails details) =>
        new(
            details.ProductLabel,
            details.PriceCents,
            details.Detail,
            details.IsPickup,
            details.Abholer is null ? null : ToAbholerDto(details.Abholer),
            details.CollectCents,
            details.CollectCount,
            details.MyPayPalUrl
        );

    private static AbholerDto ToAbholerDto(AbholerDetails abholer) =>
        new(abholer.Name, abholer.Initials, abholer.ColorHex, abholer.PayPalHandle);
}
