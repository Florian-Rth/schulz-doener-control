using FastEndpoints;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed record GetTodayOrderDayResponse(bool IsOpen, OrderDayDetailsDto? Day);

// The dashboard's central Döner-Tag section: returns today's open day (if any) or IsOpen=false when
// no day exists yet. Authenticated.
public sealed class GetTodayOrderDay : EndpointWithoutRequest<GetTodayOrderDayResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public GetTodayOrderDay(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/order-days/today");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderDayService.GetTodayAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var day = result.Value;
        var response = day is null
            ? new GetTodayOrderDayResponse(false, null)
            : new GetTodayOrderDayResponse(true, OrderDayDetailsMapper.ToDto(day));

        await Send.OkAsync(response, cancellation: ct);
    }
}
