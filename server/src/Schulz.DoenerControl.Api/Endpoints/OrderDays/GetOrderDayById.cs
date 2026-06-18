using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed record GetOrderDayByIdRequest(Guid Id);

public sealed record GetOrderDayByIdResponse(OrderDayDetailsDto Day);

public sealed class GetOrderDayByIdRequestValidator : Validator<GetOrderDayByIdRequest>
{
    public GetOrderDayByIdRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Direct day view / deep link / history for a single Döner-Tag. Authenticated; unknown id → 404.
public sealed class GetOrderDayById : Endpoint<GetOrderDayByIdRequest, GetOrderDayByIdResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public GetOrderDayById(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/order-days/{Id}");
    }

    public override async Task HandleAsync(GetOrderDayByIdRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var query = new GetOrderDayQuery(callerId, req.Id);
        var result = await orderDayService.GetByIdAsync(query, ct);

        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(
            new GetOrderDayByIdResponse(OrderDayDetailsMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
