using Microsoft.Data.Sqlite;
using Schulz.DoenerControl.Infrastructure.Persistence.Migrations;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Exercises the EnforceSinglePickupPerDay migration's data-fixup SQL directly against dirty rows the
// live (already-indexed) DB can no longer hold. Builds a minimal index-free schema, seeds days with
// multiple IsPickup=true, runs the exact statement the migration runs, and asserts the collapse rule:
// keep the row matching the day's CollectorUserId, else the earliest order; clear every other pickup.
public sealed class SinglePickupFixupTests
{
    [Fact]
    public void Should_Keep_Collector_Row_When_Multiple_Pickups()
    {
        using var connection = OpenSchema();

        // Day A: collector is the SECOND-created pickup row → it must win over the earlier stray.
        var dayA = "day-a";
        var collectorA = "user-a2";
        InsertDay(connection, dayA, collectorA);
        InsertOrder(
            connection,
            "a1",
            dayA,
            "user-a1",
            isPickup: true,
            createdAt: "2026-06-25T08:00:00Z"
        );
        InsertOrder(
            connection,
            "a2",
            dayA,
            collectorA,
            isPickup: true,
            createdAt: "2026-06-25T08:05:00Z"
        );
        InsertOrder(
            connection,
            "a3",
            dayA,
            "user-a3",
            isPickup: false,
            createdAt: "2026-06-25T08:10:00Z"
        );

        RunFixup(connection);

        Assert.Equal(new[] { "a2" }, PickupOrderIds(connection, dayA));
    }

    [Fact]
    public void Should_Keep_Earliest_Pickup_When_No_Collector_Match()
    {
        using var connection = OpenSchema();

        // Day B: collector is null (or points elsewhere) → the earliest pickup by CreatedAt wins.
        var dayB = "day-b";
        InsertDay(connection, dayB, collectorUserId: null);
        InsertOrder(
            connection,
            "b1",
            dayB,
            "user-b1",
            isPickup: true,
            createdAt: "2026-06-25T09:30:00Z"
        );
        InsertOrder(
            connection,
            "b2",
            dayB,
            "user-b2",
            isPickup: true,
            createdAt: "2026-06-25T09:00:00Z"
        );
        InsertOrder(
            connection,
            "b3",
            dayB,
            "user-b3",
            isPickup: true,
            createdAt: "2026-06-25T09:15:00Z"
        );

        RunFixup(connection);

        Assert.Equal(new[] { "b2" }, PickupOrderIds(connection, dayB));
    }

    [Fact]
    public void Should_Leave_Clean_Days_Untouched()
    {
        using var connection = OpenSchema();

        // A day with a single legitimate pickup, and a day with none, must both survive the fixup.
        InsertDay(connection, "day-c", "user-c1");
        InsertOrder(
            connection,
            "c1",
            "day-c",
            "user-c1",
            isPickup: true,
            createdAt: "2026-06-25T10:00:00Z"
        );
        InsertOrder(
            connection,
            "c2",
            "day-c",
            "user-c2",
            isPickup: false,
            createdAt: "2026-06-25T10:01:00Z"
        );

        InsertDay(connection, "day-d", collectorUserId: null);
        InsertOrder(
            connection,
            "d1",
            "day-d",
            "user-d1",
            isPickup: false,
            createdAt: "2026-06-25T11:00:00Z"
        );

        RunFixup(connection);

        Assert.Equal(new[] { "c1" }, PickupOrderIds(connection, "day-c"));
        Assert.Empty(PickupOrderIds(connection, "day-d"));
    }

    private static SqliteConnection OpenSchema()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        Execute(
            connection,
            """
            CREATE TABLE "OrderDays" (
                "Id" TEXT NOT NULL PRIMARY KEY,
                "CollectorUserId" TEXT NULL
            );
            CREATE TABLE "Orders" (
                "Id" TEXT NOT NULL PRIMARY KEY,
                "OrderDayId" TEXT NOT NULL,
                "UserId" TEXT NOT NULL,
                "IsPickup" INTEGER NOT NULL,
                "CreatedAt" TEXT NOT NULL
            );
            """
        );
        return connection;
    }

    private static void RunFixup(SqliteConnection connection) =>
        Execute(connection, SinglePickupFixupSql.CollapseStrayPickups);

    private static void InsertDay(SqliteConnection connection, string id, string? collectorUserId)
    {
        using var command = connection.CreateCommand();
        command.CommandText =
            "INSERT INTO \"OrderDays\" (\"Id\", \"CollectorUserId\") VALUES ($id, $collector)";
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$collector", (object?)collectorUserId ?? DBNull.Value);
        command.ExecuteNonQuery();
    }

    private static void InsertOrder(
        SqliteConnection connection,
        string id,
        string orderDayId,
        string userId,
        bool isPickup,
        string createdAt
    )
    {
        using var command = connection.CreateCommand();
        command.CommandText =
            "INSERT INTO \"Orders\" (\"Id\", \"OrderDayId\", \"UserId\", \"IsPickup\", \"CreatedAt\") "
            + "VALUES ($id, $day, $user, $pickup, $created)";
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$day", orderDayId);
        command.Parameters.AddWithValue("$user", userId);
        command.Parameters.AddWithValue("$pickup", isPickup ? 1 : 0);
        command.Parameters.AddWithValue("$created", createdAt);
        command.ExecuteNonQuery();
    }

    private static IReadOnlyList<string> PickupOrderIds(
        SqliteConnection connection,
        string orderDayId
    )
    {
        using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT \"Id\" FROM \"Orders\" WHERE \"OrderDayId\" = $day AND \"IsPickup\" ORDER BY \"Id\"";
        command.Parameters.AddWithValue("$day", orderDayId);

        var ids = new List<string>();
        using var reader = command.ExecuteReader();
        while (reader.Read())
            ids.Add(reader.GetString(0));
        return ids;
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }
}
