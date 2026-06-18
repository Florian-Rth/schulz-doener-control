using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Orders;

public interface IOrderService
{
    Task<Result<OrderDetails>> UpsertMineAsync(UpsertOrderCommand command, CancellationToken ct);

    // Null value = the caller has no order on the day yet.
    Task<Result<OrderDetails?>> GetMineAsync(GetMyOrderQuery query, CancellationToken ct);

    Task<Result> DeleteMineAsync(DeleteOrderCommand command, CancellationToken ct);

    Task<Result<OrderResultDetails>> GetResultAsync(
        GetOrderResultQuery query,
        CancellationToken ct
    );
}
