using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Orders;

// The single fail-safe rule for which orders may feed statistics (Bestenliste, Döner-Tiere and the
// dashboard tiles). An order counts ONLY once its Döner-Tag is CLOSED and — for a non-pickup order —
// its debt has been SETTLED (the payer confirmed they sent the money). The pickup person / collector
// carries no debt, so a closed day alone qualifies them. Keeping this in one place guarantees every
// statistic gates identically, so an open, aborted or never-finished day, or an unpaid debt, can
// never inflate the numbers.
internal static class StatsOrderFilter
{
    public static IQueryable<Order> CountingTowardStats(
        this IQueryable<Order> orders,
        AppDbContext database
    ) =>
        orders.Where(order =>
            order.OrderDay!.Status == OrderDayStatus.Closed
            && (
                order.IsPickup
                || database.Debts.Any(debt =>
                    debt.OrderId == order.Id && debt.Status == PaymentStatus.Settled
                )
            )
        );
}
