using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSinglePickupPerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Data-fixup FIRST so the unique index below cannot trip on dirty production rows where a
            // day had multiple IsPickup=true (the bug this migration closes). The SQL lives in
            // SinglePickupFixupSql so a test exercises the exact statement.
            migrationBuilder.Sql(SinglePickupFixupSql.CollapseStrayPickups);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderDayId",
                table: "Orders",
                column: "OrderDayId",
                unique: true,
                filter: "\"IsPickup\""
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Orders_OrderDayId", table: "Orders");
        }
    }
}
