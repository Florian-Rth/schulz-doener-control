using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPickupWheelSpins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PickupWheelSpins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderDayId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Round = table.Column<int>(type: "INTEGER", nullable: false),
                    ChosenUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SpunAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    ExcusedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickupWheelSpins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PickupWheelSpins_OrderDays_OrderDayId",
                        column: x => x.OrderDayId,
                        principalTable: "OrderDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_PickupWheelSpins_Users_ChosenUserId",
                        column: x => x.ChosenUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_PickupWheelSpins_ChosenUserId",
                table: "PickupWheelSpins",
                column: "ChosenUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PickupWheelSpins_OrderDayId_Round",
                table: "PickupWheelSpins",
                columns: new[] { "OrderDayId", "Round" },
                unique: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PickupWheelSpins");
        }
    }
}
