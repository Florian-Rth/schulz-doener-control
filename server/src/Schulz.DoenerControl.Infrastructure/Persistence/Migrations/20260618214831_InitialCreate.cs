using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    DefaultPriceCents = table.Column<int>(type: "INTEGER", nullable: false),
                    Kind = table.Column<int>(type: "INTEGER", nullable: false),
                    MaterialIcon = table.Column<string>(
                        type: "TEXT",
                        maxLength: 64,
                        nullable: false
                    ),
                    Note = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    IsInsider = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    NormalizedUserName = table.Column<string>(
                        type: "TEXT",
                        maxLength: 64,
                        nullable: false
                    ),
                    DisplayName = table.Column<string>(
                        type: "TEXT",
                        maxLength: 128,
                        nullable: false
                    ),
                    PayPalHandle = table.Column<string>(
                        type: "TEXT",
                        maxLength: 128,
                        nullable: true
                    ),
                    PasswordHash = table.Column<byte[]>(type: "BLOB", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    MustChangePassword = table.Column<bool>(type: "INTEGER", nullable: false),
                    AvatarColorHex = table.Column<string>(
                        type: "TEXT",
                        maxLength: 9,
                        nullable: false
                    ),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "OrderDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Synonym = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    OrderCutoffAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    OpenedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OpenedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    ClosedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    CollectorUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderDays_Users_CollectorUserId",
                        column: x => x.CollectorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_OrderDays_Users_OpenedByUserId",
                        column: x => x.OpenedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "PushSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Endpoint = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    P256dh = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Auth = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PushSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PushSubscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TokenHash = table.Column<byte[]>(type: "BLOB", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    ReplacedByTokenHash = table.Column<byte[]>(type: "BLOB", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    OrderDayId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    ReadAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_OrderDays_OrderDayId",
                        column: x => x.OrderDayId,
                        principalTable: "OrderDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Notifications_Users_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderDayId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProductId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Kind = table.Column<int>(type: "INTEGER", nullable: false),
                    Meat = table.Column<int>(type: "INTEGER", nullable: true),
                    PizzaVariant = table.Column<int>(type: "INTEGER", nullable: true),
                    Sauces = table.Column<int>(type: "INTEGER", nullable: false),
                    PriceCents = table.Column<int>(type: "INTEGER", nullable: false),
                    Extra = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    IsPickup = table.Column<bool>(type: "INTEGER", nullable: false),
                    OccurredOn = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_MenuItems_ProductId",
                        column: x => x.ProductId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Orders_OrderDays_OrderDayId",
                        column: x => x.OrderDayId,
                        principalTable: "OrderDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_Orders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "Debts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DebtorUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreditorUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrderId = table.Column<Guid>(type: "TEXT", nullable: true),
                    OrderDayId = table.Column<Guid>(type: "TEXT", nullable: true),
                    AmountCents = table.Column<int>(type: "INTEGER", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    SettledAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Debts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Debts_OrderDays_OrderDayId",
                        column: x => x.OrderDayId,
                        principalTable: "OrderDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Debts_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Debts_Users_CreditorUserId",
                        column: x => x.CreditorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_Debts_Users_DebtorUserId",
                        column: x => x.DebtorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

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

            migrationBuilder.CreateIndex(
                name: "IX_Debts_CreditorUserId",
                table: "Debts",
                column: "CreditorUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Debts_DebtorUserId",
                table: "Debts",
                column: "DebtorUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Debts_OrderDayId",
                table: "Debts",
                column: "OrderDayId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Debts_OrderId",
                table: "Debts",
                column: "OrderId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_OrderDayId",
                table: "Notifications",
                column: "OrderDayId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientUserId",
                table: "Notifications",
                column: "RecipientUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_CollectorUserId",
                table: "OrderDays",
                column: "CollectorUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_Date",
                table: "OrderDays",
                column: "Date",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderDays_OpenedByUserId",
                table: "OrderDays",
                column: "OpenedByUserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderDayId_UserId",
                table: "Orders",
                columns: new[] { "OrderDayId", "UserId" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ProductId",
                table: "Orders",
                column: "ProductId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_PushSubscriptions_Endpoint",
                table: "PushSubscriptions",
                column: "Endpoint",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_PushSubscriptions_UserId",
                table: "PushSubscriptions",
                column: "UserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Users_NormalizedUserName",
                table: "Users",
                column: "NormalizedUserName",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Debts");

            migrationBuilder.DropTable(name: "Notifications");

            migrationBuilder.DropTable(name: "PushSubscriptions");

            migrationBuilder.DropTable(name: "RefreshTokens");

            migrationBuilder.DropTable(name: "Orders");

            migrationBuilder.DropTable(name: "MenuItems");

            migrationBuilder.DropTable(name: "OrderDays");

            migrationBuilder.DropTable(name: "Users");
        }
    }
}
