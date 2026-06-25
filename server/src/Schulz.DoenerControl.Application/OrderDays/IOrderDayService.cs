using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.OrderDays;

public interface IOrderDayService
{
    // Null value = no open or existing day today (the dashboard renders the closed state).
    Task<Result<OrderDayDetails?>> GetTodayAsync(Guid callerId, CancellationToken ct);

    Task<Result<OpenDayResult>> OpenTodayAsync(OpenDayCommand command, CancellationToken ct);

    Task<Result<CloseDayResult>> CloseAsync(CloseDayCommand command, CancellationToken ct);

    // Admin scrap-and-end: discards every order and closes the day, in any open state, WITHOUT
    // creating debts. Authorization (admin-only) is enforced at the endpoint.
    Task<Result<ForceEndDayResult>> ForceEndAsync(
        Guid callerUserId,
        Guid orderDayId,
        CancellationToken ct
    );

    Task<Result<OrderDayDetails>> CloseOrderingAsync(
        CloseOrderingCommand command,
        CancellationToken ct
    );

    Task<Result<OrderDayDetails>> GetByIdAsync(GetOrderDayQuery query, CancellationToken ct);
}
