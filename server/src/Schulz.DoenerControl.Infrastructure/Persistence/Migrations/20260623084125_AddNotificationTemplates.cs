using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Synonym = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 280, nullable: false),
                    IsActive = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplates", x => x.Id);
                }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "NotificationTemplates");
        }
    }
}
