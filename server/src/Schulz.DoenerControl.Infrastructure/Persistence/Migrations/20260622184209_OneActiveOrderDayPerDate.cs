using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OneActiveOrderDayPerDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_OrderDays_Date", table: "OrderDays");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_Date",
                table: "OrderDays",
                column: "Date",
                unique: true,
                filter: "\"Status\" <> 2"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_OrderDays_Date", table: "OrderDays");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_Date",
                table: "OrderDays",
                column: "Date",
                unique: true
            );
        }
    }
}
