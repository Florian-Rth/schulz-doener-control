using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WidenAndUrlifyPayPalHandle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The PayPal setting still stores the bare handle: the user enters a full link, the app
            // parses the handle out of it, and links are reconstructed from the handle on the way out.
            // So there is NO data fixup here — existing bare handles must stay handles untouched. Only
            // the harmless column-width bump below remains, to keep the model snapshot consistent.

            // Widen the column. On SQLite the max-length is a model-level
            // constraint only (TEXT is unbounded), so this AlterColumn keeps the migration honest for
            // every provider while being a no-op on the live SQLite schema.
            migrationBuilder.AlterColumn<string>(
                name: "PayPalHandle",
                table: "Users",
                type: "TEXT",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 128,
                oldNullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PayPalHandle",
                table: "Users",
                type: "TEXT",
                maxLength: 128,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 256,
                oldNullable: true
            );
        }
    }
}
