using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "OrderDays",
                type: "TEXT",
                nullable: true
            );

            migrationBuilder.CreateTable(
                name: "Stores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stores", x => x.Id);
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_StoreId",
                table: "OrderDays",
                column: "StoreId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Stores_Key",
                table: "Stores",
                column: "Key",
                unique: true
            );

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDays_Stores_StoreId",
                table: "OrderDays",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            // Establish the single bootstrap store (fixed id, mirrored by StoreSeeder) and backfill
            // every existing Döner-Tag onto it so no live row is left unscoped. The backfill resolves
            // the id via the Key subquery rather than a hard-coded literal, so it stays byte-identical
            // to however EF's SQLite Guid mapping serialised the row above.
            migrationBuilder.InsertData(
                table: "Stores",
                columns: new[] { "Id", "Key", "Name", "SortOrder", "IsActive", "CreatedAt" },
                values: new object[]
                {
                    new Guid("11111111-1111-4111-8111-111111111111"),
                    "schulz-doener",
                    "Schulz Döner",
                    0,
                    true,
                    new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
                }
            );

            migrationBuilder.Sql(
                "UPDATE \"OrderDays\" "
                    + "SET \"StoreId\" = (SELECT \"Id\" FROM \"Stores\" WHERE \"Key\" = 'schulz-doener') "
                    + "WHERE \"StoreId\" IS NULL;"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDays_Stores_StoreId",
                table: "OrderDays"
            );

            migrationBuilder.DropTable(name: "Stores");

            migrationBuilder.DropIndex(name: "IX_OrderDays_StoreId", table: "OrderDays");

            migrationBuilder.DropColumn(name: "StoreId", table: "OrderDays");
        }
    }
}
