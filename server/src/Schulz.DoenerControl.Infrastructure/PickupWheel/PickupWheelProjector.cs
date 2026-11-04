using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.PickupWheel;

// Projects the day's latest Glücksrad spin for the caller. Expects the day's orders with their
// users loaded (the OrderDayService projection already has them).
public sealed class PickupWheelProjector
{
    private readonly AppDbContext database;

    public PickupWheelProjector(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<PickupWheelDetails?> ProjectAsync(
        OrderDay day,
        IReadOnlyCollection<Order> orders,
        Guid callerId,
        CancellationToken ct
    )
    {
        var spins = await LoadSpinsAsync(day.Id, ct);
        if (spins.Count == 0)
            return null;

        var latest = spins[^1];
        var spinInputs = spins.Select(ToInput).ToList();
        var participants = orders.Select(ToParticipant).ToList();
        var usersById = BuildUserLookup(orders, spins);

        var candidateIds = PickupWheelDraw
            .CandidatesFor(participants, spinInputs, ToInput(latest))
            .ToList();
        // A chosen person who deleted their order afterwards still has to show up on their wheel.
        if (!candidateIds.Contains(latest.ChosenUserId))
            candidateIds.Add(latest.ChosenUserId);

        return new PickupWheelDetails(
            latest.Id,
            latest.Round,
            candidateIds
                .Select(id => ToCandidate(usersById[id], id == latest.ChosenUserId))
                .ToList(),
            usersById[latest.ChosenUserId].DisplayName,
            latest.ChosenUserId == callerId,
            CanExcuse(day, latest, participants, spinInputs, callerId),
            spins
                .Where(spin => spin.ExcusedAt is not null)
                .Select(spin => usersById[spin.ChosenUserId].DisplayName)
                .ToList()
        );
    }

    private async Task<IReadOnlyList<PickupWheelSpin>> LoadSpinsAsync(
        Guid orderDayId,
        CancellationToken ct
    )
    {
        var spins = await database
            .PickupWheelSpins.AsNoTracking()
            .Include(spin => spin.ChosenUser)
            .Where(spin => spin.OrderDayId == orderDayId)
            .ToListAsync(ct);
        return spins.OrderBy(spin => spin.Round).ToList();
    }

    private static Dictionary<Guid, User> BuildUserLookup(
        IReadOnlyCollection<Order> orders,
        IReadOnlyCollection<PickupWheelSpin> spins
    )
    {
        var users = new Dictionary<Guid, User>();
        foreach (var user in spins.Select(spin => spin.ChosenUser))
        {
            if (user is not null)
                users[user.Id] = user;
        }
        foreach (var user in orders.Select(order => order.User))
        {
            if (user is not null)
                users[user.Id] = user;
        }
        return users;
    }

    private static bool CanExcuse(
        OrderDay day,
        PickupWheelSpin latest,
        IReadOnlyCollection<WheelParticipant> participants,
        IReadOnlyCollection<WheelSpinInput> spins,
        Guid callerId
    )
    {
        var isStillTheChosenCollector =
            latest.ChosenUserId == callerId
            && latest.ExcusedAt is null
            && day.CollectorUserId == callerId;
        var dayStillOpen = day.Status == OrderDayStatus.Open && day.OrderingClosedAt is null;
        if (!isStillTheChosenCollector || !dayStillOpen)
            return false;

        var excused = PickupWheelService.ExcusedIncluding(spins, callerId);
        return PickupWheelDraw.EligibleFor(participants, excused).Count > 0;
    }

    private static WheelCandidateSummary ToCandidate(User user, bool isChosen) =>
        new(
            user.DisplayName,
            NameFormatter.InitialsOf(user.DisplayName),
            user.AvatarColorHex,
            isChosen
        );

    internal static WheelParticipant ToParticipant(Order order) =>
        new(order.UserId, order.CreatedAt);

    internal static WheelSpinInput ToInput(PickupWheelSpin spin) =>
        new(spin.Round, spin.ChosenUserId, spin.SpunAt, spin.ExcusedAt is not null);
}
