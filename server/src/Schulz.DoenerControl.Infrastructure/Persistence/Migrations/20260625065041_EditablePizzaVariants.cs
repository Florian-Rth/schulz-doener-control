using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EditablePizzaVariants : Migration
    {
        // The 5 canonical pizza sorts with FIXED Guids (these mirror Core.CanonicalPizzaVariants and
        // are the stable wire `value` a pizza line carries). The int is the retired Core.Enums
        // .PizzaVariant value (1..5) any existing OrderLine.PizzaVariant column held, so the backfill
        // can map old rows onto these ids.
        private static readonly (
            string Id,
            string Name,
            int SortOrder,
            int LegacyEnumValue
        )[] Seed =
        [
            ("b1a7c0de-0001-4a01-9a01-000000000001", "Salami", 1, 1),
            ("b1a7c0de-0002-4a02-9a02-000000000002", "Margherita", 2, 2),
            ("b1a7c0de-0003-4a03-9a03-000000000003", "Funghi", 3, 3),
            ("b1a7c0de-0004-4a04-9a04-000000000004", "Tonno", 4, 4),
            ("b1a7c0de-0005-4a05-9a05-000000000005", "Hawaii", 5, 5),
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Create the catalog table and seed the 5 canonical variants with fixed Guids
            //    (IsAvailable=true, deterministic — no DateTime.Now).
            migrationBuilder.CreateTable(
                name: "PizzaVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Icon = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsAvailable = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PizzaVariants", x => x.Id);
                }
            );

            foreach (var (id, name, sortOrder, _) in Seed)
            {
                migrationBuilder.InsertData(
                    table: "PizzaVariants",
                    columns: new[] { "Id", "Name", "Icon", "SortOrder", "IsAvailable" },
                    values: new object[] { new Guid(id), name, null, sortOrder, true }
                );
            }

            // 2) Add the new nullable FK column alongside the old int column.
            migrationBuilder.AddColumn<Guid>(
                name: "PizzaVariantId",
                table: "OrderLines",
                type: "TEXT",
                nullable: true
            );

            // 3) Backfill: map any existing OrderLine.PizzaVariant int (1..5) onto the seeded id.
            //    Robust whether or not any rows exist (a no-op on an empty table). The map is written
            //    out per value so it works on SQLite without a CASE/JOIN dialect dependency.
            foreach (var (id, _, _, legacyEnumValue) in Seed)
            {
                migrationBuilder.Sql(
                    $"UPDATE \"OrderLines\" SET \"PizzaVariantId\" = '{id}' "
                        + $"WHERE \"PizzaVariant\" = {legacyEnumValue};"
                );
            }

            // 4) Drop the retired int column (EF rebuilds the SQLite table, preserving PizzaVariantId).
            migrationBuilder.DropColumn(name: "PizzaVariant", table: "OrderLines");

            // 5) Index + RESTRICT FK onto the catalog.
            migrationBuilder.CreateIndex(
                name: "IX_OrderLines_PizzaVariantId",
                table: "OrderLines",
                column: "PizzaVariantId"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_OrderLines_PizzaVariants_PizzaVariantId",
                table: "OrderLines",
                column: "PizzaVariantId",
                principalTable: "PizzaVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderLines_PizzaVariants_PizzaVariantId",
                table: "OrderLines"
            );

            migrationBuilder.DropIndex(name: "IX_OrderLines_PizzaVariantId", table: "OrderLines");

            // Re-add the retired int column and map the seeded ids back onto their legacy values.
            migrationBuilder.AddColumn<int>(
                name: "PizzaVariant",
                table: "OrderLines",
                type: "INTEGER",
                nullable: true
            );

            foreach (var (id, _, _, legacyEnumValue) in Seed)
            {
                migrationBuilder.Sql(
                    $"UPDATE \"OrderLines\" SET \"PizzaVariant\" = {legacyEnumValue} "
                        + $"WHERE \"PizzaVariantId\" = '{id}';"
                );
            }

            migrationBuilder.DropColumn(name: "PizzaVariantId", table: "OrderLines");

            migrationBuilder.DropTable(name: "PizzaVariants");
        }
    }
}
