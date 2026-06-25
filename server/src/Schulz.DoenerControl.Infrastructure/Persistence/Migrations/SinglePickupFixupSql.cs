namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations;

// The data-fixup the EnforceSinglePickupPerDay migration runs before creating the filtered unique
// index, hoisted to a constant so a test can exercise the exact same SQL without re-typing it (and
// drifting). Per OrderDay, keep ONE pickup — preferring the row whose UserId is the day's
// CollectorUserId, else the earliest order (CreatedAt then Id) — and clear IsPickup on every other.
public static class SinglePickupFixupSql
{
    public const string CollapseStrayPickups = """
        UPDATE "Orders"
        SET "IsPickup" = 0
        WHERE "IsPickup"
          AND "Id" NOT IN (
            SELECT keep."Id"
            FROM "Orders" keep
            WHERE keep."IsPickup"
              AND keep."Id" = (
                SELECT cand."Id"
                FROM "Orders" cand
                LEFT JOIN "OrderDays" day ON day."Id" = cand."OrderDayId"
                WHERE cand."OrderDayId" = keep."OrderDayId"
                  AND cand."IsPickup"
                ORDER BY
                  CASE WHEN cand."UserId" = day."CollectorUserId" THEN 0 ELSE 1 END,
                  cand."CreatedAt",
                  cand."Id"
                LIMIT 1
              )
          );
        """;
}
