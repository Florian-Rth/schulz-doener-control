using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItemIsAvailableAndDropMenuSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "big");

            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "box");

            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "danny");

            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "doener");

            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "duerum");

            migrationBuilder.DeleteData(table: "MenuItems", keyColumn: "Id", keyValue: "pizza");

            migrationBuilder.AddColumn<bool>(
                name: "IsAvailable",
                table: "MenuItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsAvailable", table: "MenuItems");

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[]
                {
                    "Id",
                    "DefaultPriceCents",
                    "IsInsider",
                    "Kind",
                    "MaterialIcon",
                    "Name",
                    "Note",
                    "SortOrder",
                },
                values: new object[,]
                {
                    { "big", 950, false, 1, "lunch_dining", "Big Döner", null, 3 },
                    { "box", 650, false, 1, "takeout_dining", "Dönerbox", null, 4 },
                    {
                        "danny",
                        600,
                        true,
                        1,
                        "workspace_premium",
                        "Danny-Box",
                        "Pommes · Fleisch · Soße",
                        5,
                    },
                    { "doener", 750, false, 1, "kebab_dining", "Döner", null, 1 },
                    { "duerum", 800, false, 1, "wrap_text", "Dürüm", null, 2 },
                    { "pizza", 900, false, 2, "local_pizza", "Pizza", null, 6 },
                }
            );
        }
    }
}
