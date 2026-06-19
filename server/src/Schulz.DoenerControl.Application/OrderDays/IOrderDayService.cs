using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.OrderDays;

public interface IOrderDayService
{
    // Null value = no open or existing day today (the dashboard renders the closed state).
    Task<Result<OrderDayDetails?>> GetTodayAsync(Guid callerId, CancellationToken ct);

    Task<Result<OpenDayResult>> OpenTodayAsync(OpenDayCommand command, CancellationToken ct);

    Task<Result<CloseDayResult>> CloseAsync(CloseDayCommand command, CancellationToken ct);

    Task<Result<OrderDayDetails>> CloseOrderingAsync(
        CloseOrderingCommand command,
        CancellationToken ct
    );

    Task<Result<OrderDayDetails>> GetByIdAsync(GetOrderDayQuery query, CancellationToken ct);
}
