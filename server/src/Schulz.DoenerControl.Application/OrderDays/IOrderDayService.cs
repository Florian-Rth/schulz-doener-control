using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.OrderDays;

public interface IOrderDayService
{
    // Null value = no open or existing day today (the dashboard renders the closed state).
    Task<Result<OrderDayDetails?>> GetTodayAsync(Guid callerId, CancellationToken ct);

    Task<Result<OpenDayResult>> OpenTodayAsync(OpenDayCommand command, CancellationToken ct);

    Task<Result<CloseDayResult>> CloseAsync(CloseDayCommand command, CancellationToken ct);

    // Scrap-and-end: discards every order and closes the day, in any open state, WITHOUT creating
    // debts. Allowed for an admin OR the day's designated collector (Abholer); anyone else is
    // Forbidden. Enforced here (server-side) — the endpoint passes the caller's admin-ness.
    Task<Result<ForceEndDayResult>> ForceEndAsync(
        Guid callerUserId,
        bool callerIsAdmin,
        Guid orderDayId,
        CancellationToken ct
    );

    Task<Result<OrderDayDetails>> CloseOrderingAsync(
        CloseOrderingCommand command,
        CancellationToken ct
    );

    Task<Result<OrderDayDetails>> GetByIdAsync(GetOrderDayQuery query, CancellationToken ct);
}
