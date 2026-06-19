using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitOrderIntoHeaderAndLines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create the child table FIRST, while the Orders per-item columns still exist.
            migrationBuilder.CreateTable(
                name: "OrderLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProductId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Kind = table.Column<int>(type: "INTEGER", nullable: false),
                    Meat = table.Column<int>(type: "INTEGER", nullable: true),
                    PizzaVariant = table.Column<int>(type: "INTEGER", nullable: true),
                    Sauces = table.Column<int>(type: "INTEGER", nullable: false),
                    PriceCents = table.Column<int>(type: "INTEGER", nullable: false),
                    Extra = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderLines_MenuItems_ProductId",
                        column: x => x.ProductId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_OrderLines_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderLines_OrderId",
                table: "OrderLines",
                column: "OrderId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderLines_ProductId",
                table: "OrderLines",
                column: "ProductId"
            );

            // 2. Backfill exactly one OrderLine per existing Order, copying the per-item columns with
            //    Quantity = 1 and a freshly generated GUID Id. This MUST run before the column drops,
            //    because SQLite renders the drops as a table rebuild that discards the old columns.
            //    The Id is built from randomblob in EF's canonical 8-4-4-4-12 hex layout (read back
            //    case-insensitively as a Guid).
            migrationBuilder.Sql(
                @"
                INSERT INTO ""OrderLines""
                    (""Id"", ""OrderId"", ""ProductId"", ""Kind"", ""Meat"", ""PizzaVariant"", ""Sauces"", ""PriceCents"", ""Extra"", ""Quantity"")
                SELECT
                    lower(
                        hex(randomblob(4)) || '-' ||
                        hex(randomblob(2)) || '-' ||
                        hex(randomblob(2)) || '-' ||
                        hex(randomblob(2)) || '-' ||
                        hex(randomblob(6))
                    ),
                    ""Id"",
                    ""ProductId"",
                    ""Kind"",
                    ""Meat"",
                    ""PizzaVariant"",
                    ""Sauces"",
                    ""PriceCents"",
                    ""Extra"",
                    1
                FROM ""Orders"";
                "
            );

            // 3. Now drop the per-item columns and the product FK/index from Orders (table rebuild).
            migrationBuilder.DropForeignKey(name: "FK_Orders_MenuItems_ProductId", table: "Orders");

            migrationBuilder.DropIndex(name: "IX_Orders_ProductId", table: "Orders");

            migrationBuilder.DropColumn(name: "Extra", table: "Orders");

            migrationBuilder.DropColumn(name: "Kind", table: "Orders");

            migrationBuilder.DropColumn(name: "Meat", table: "Orders");

            migrationBuilder.DropColumn(name: "PizzaVariant", table: "Orders");

            migrationBuilder.DropColumn(name: "PriceCents", table: "Orders");

            migrationBuilder.DropColumn(name: "ProductId", table: "Orders");

            migrationBuilder.DropColumn(name: "Sauces", table: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "OrderLines");

            migrationBuilder.AddColumn<string>(
                name: "Extra",
                table: "Orders",
                type: "TEXT",
                maxLength: 256,
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "Orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<int>(
                name: "Meat",
                table: "Orders",
                type: "INTEGER",
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "PizzaVariant",
                table: "Orders",
                type: "INTEGER",
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "PriceCents",
                table: "Orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<string>(
                name: "ProductId",
                table: "Orders",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: ""
            );

            migrationBuilder.AddColumn<int>(
                name: "Sauces",
                table: "Orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ProductId",
                table: "Orders",
                column: "ProductId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_MenuItems_ProductId",
                table: "Orders",
                column: "ProductId",
                principalTable: "MenuItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );
        }
    }
}
