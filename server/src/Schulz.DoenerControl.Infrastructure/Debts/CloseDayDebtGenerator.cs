using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Debts;

// Crystallizes a day's debts when it closes: one Debt per non-pickup participant → the single
// designated collector, for that participant's own order price. The collector is OrderDay.Collector
// when set, otherwise defaults to the opener if they picked up, else the first pickup (by order
// creation). No pickup at all → no collector → no debts. Adds the Debt rows to the tracked context;
// the caller's SaveChanges persists them in the same transaction as the close.
public sealed class CloseDayDebtGenerator
{
    private const string Reason = "Döner-Tag";

    private readonly AppDbContext database;

    public CloseDayDebtGenerator(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<int> GenerateForCloseAsync(
        OrderDay day,
        DateTimeOffset now,
        CancellationToken ct
    )
    {
        var orders = await database
            .Orders.Where(order => order.OrderDayId == day.Id)
            .ToListAsync(ct);

        var collectorId = ResolveCollector(day, orders);
        if (collectorId is null)
            return 0;

        var debtors = orders
            .Where(order => !order.IsPickup && order.UserId != collectorId.Value)
            .ToList();

        foreach (var debtor in debtors)
        {
            database.Debts.Add(
                new Debt
                {
                    Id = Guid.NewGuid(),
                    DebtorUserId = debtor.UserId,
                    CreditorUserId = collectorId.Value,
                    OrderId = debtor.Id,
                    OrderDayId = day.Id,
                    AmountCents = debtor.PriceCents,
                    Reason = Reason,
                    Status = PaymentStatus.Open,
                    CreatedAt = now,
                    SettledAt = null,
                }
            );
        }

        return debtors.Count;
    }

    private static Guid? ResolveCollector(OrderDay day, IReadOnlyList<Order> orders)
    {
        if (day.CollectorUserId is { } designated)
            return designated;

        var pickups = orders
            .Where(order => order.IsPickup)
            .OrderBy(order => order.CreatedAt)
            .ToList();
        if (pickups.Count == 0)
            return null;

        var openerPickup = pickups.FirstOrDefault(order => order.UserId == day.OpenedByUserId);
        return openerPickup?.UserId ?? pickups[0].UserId;
    }
}
