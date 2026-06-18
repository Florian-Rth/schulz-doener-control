using FastEndpoints;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed record OpenDayResponse(OrderDayDetailsDto Day, int NotifiedColleagueCount);

// The "Ich will heute Döner!" flow: opens today's Döner-Tag with a random synonym + cutoff and
// notifies every other active colleague. Idempotent — re-opening today returns the existing day and
// notifies nobody again. Authenticated.
public sealed class OpenDay : EndpointWithoutRequest<OpenDayResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public OpenDay(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/open");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderDayService.OpenTodayAsync(new OpenDayCommand(callerId), ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        var value = result.Value;
        var response = new OpenDayResponse(
            OrderDayDetailsMapper.ToDto(value.Day),
            value.NotifiedColleagueCount
        );
        await Send.OkAsync(response, cancellation: ct);
    }
}
