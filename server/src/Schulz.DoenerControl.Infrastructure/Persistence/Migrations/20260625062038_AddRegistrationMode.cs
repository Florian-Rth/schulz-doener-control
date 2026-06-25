using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RegistrationMode",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Mode = table.Column<int>(type: "INTEGER", nullable: false),
                    SecretKey = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrationMode", x => x.Id);
                }
            );

            // Seed the single singleton row with the product-default policy (Mode=1 Enabled, no
            // secret key). Fixed Guid and fixed timestamp keep the migration deterministic.
            migrationBuilder.InsertData(
                table: "RegistrationMode",
                columns: new[] { "Id", "Mode", "SecretKey", "UpdatedAt" },
                values: new object[]
                {
                    new Guid("a3f1c2d4-5e6b-47a8-9c0d-1e2f3a4b5c6d"),
                    1,
                    null,
                    new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RegistrationMode");
        }
    }
}
