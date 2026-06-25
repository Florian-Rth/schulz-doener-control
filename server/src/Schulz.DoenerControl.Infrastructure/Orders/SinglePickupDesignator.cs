using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Orders;

// Enforces the per-day invariant "at most ONE Order.IsPickup=true". Every write path that sets a
// pickup funnels through here so the chosen order becomes the sole pickup and every other order of
// the same day is demoted. Distinct from CollectorDesignation, which reconciles OrderDay.CollectorUserId.
//
// Two-phase persist: SQLite validates the filtered unique index per statement within a batch, so
// flipping the new pickup ON before the previous one is flipped OFF would momentarily leave two
// pickups and trip the index. We therefore clear every other row and SaveChanges FIRST, then set the
// winner. The caller does the final SaveChanges (so it can bundle other tracked changes, e.g. lines).
internal static class SinglePickupDesignator
{
    public static async Task DesignateAsync(
        AppDbContext database,
        IReadOnlyCollection<Order> dayOrders,
        Guid pickupUserId,
        DateTimeOffset updatedAt,
        CancellationToken ct
    )
    {
        var clearedAny = false;
        foreach (var order in dayOrders)
        {
            if (order.UserId == pickupUserId || !order.IsPickup)
                continue;

            order.IsPickup = false;
            order.UpdatedAt = updatedAt;
            clearedAny = true;
        }

        // Persist the demotions before flipping the winner on, so the index never sees two pickups.
        if (clearedAny)
            await database.SaveChangesAsync(ct);

        var winner = dayOrders.SingleOrDefault(order => order.UserId == pickupUserId);
        if (winner is not null && !winner.IsPickup)
        {
            winner.IsPickup = true;
            winner.UpdatedAt = updatedAt;
        }
    }
}
