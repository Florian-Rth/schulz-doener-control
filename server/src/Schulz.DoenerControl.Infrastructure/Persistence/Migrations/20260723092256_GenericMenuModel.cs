using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Schulz.DoenerControl.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GenericMenuModel : Migration
    {
        // A random Guid in the upper-case text form EF's SQLite provider stores Guids in.
        private const string NewGuidSql =
            @"upper(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2))
                || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6)))";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── EXPAND (additive, no loss) ─────────────────────────────────────────────────────
            // New engine tables + the new nullable MenuItem columns + the OrderLine.Answers column.
            // The old typed columns (Meat/Sauces/PizzaVariantId/Kind/Extra) and the PizzaVariants
            // table survive through the backfill below and are only dropped in CONTRACT.
            migrationBuilder.AddColumn<string>(
                name: "Answers",
                table: "OrderLines",
                type: "TEXT",
                nullable: false,
                defaultValue: "{}"
            );

            migrationBuilder.AddColumn<string>(
                name: "BaseItemId",
                table: "MenuItems",
                type: "TEXT",
                maxLength: 32,
                nullable: true
            );

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "MenuItems",
                type: "TEXT",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "DefaultAnswers",
                table: "MenuItems",
                type: "TEXT",
                nullable: true
            );

            migrationBuilder.AddColumn<Guid>(
                name: "StoreId",
                table: "MenuItems",
                type: "TEXT",
                nullable: true
            );

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StoreId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsAvailable = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "FieldDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StoreId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Label = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Display = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxLength = table.Column<int>(type: "INTEGER", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldDefinitions_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "CategoryFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CategoryId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FieldDefinitionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsRequired = table.Column<bool>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryFields_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_CategoryFields_FieldDefinitions_FieldDefinitionId",
                        column: x => x.FieldDefinitionId,
                        principalTable: "FieldDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "FieldOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FieldDefinitionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Label = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Icon = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    PriceDeltaCents = table.Column<int>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsAvailable = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldOptions_FieldDefinitions_FieldDefinitionId",
                        column: x => x.FieldDefinitionId,
                        principalTable: "FieldDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_BaseItemId",
                table: "MenuItems",
                column: "BaseItemId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_CategoryId",
                table: "MenuItems",
                column: "CategoryId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_StoreId",
                table: "MenuItems",
                column: "StoreId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_Categories_StoreId_Key",
                table: "Categories",
                columns: new[] { "StoreId", "Key" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_CategoryFields_CategoryId_FieldDefinitionId",
                table: "CategoryFields",
                columns: new[] { "CategoryId", "FieldDefinitionId" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_CategoryFields_FieldDefinitionId",
                table: "CategoryFields",
                column: "FieldDefinitionId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_FieldDefinitions_StoreId_Key",
                table: "FieldDefinitions",
                columns: new[] { "StoreId", "Key" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_FieldOptions_FieldDefinitionId_Key",
                table: "FieldOptions",
                columns: new[] { "FieldDefinitionId", "Key" },
                unique: true
            );

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_Categories_CategoryId",
                table: "MenuItems",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_MenuItems_BaseItemId",
                table: "MenuItems",
                column: "BaseItemId",
                principalTable: "MenuItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            migrationBuilder.AddForeignKey(
                name: "FK_MenuItems_Stores_StoreId",
                table: "MenuItems",
                column: "StoreId",
                principalTable: "Stores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict
            );

            // ── BACKFILL (raw SQL, while the old typed columns still exist) ────────────────────
            // Fold Meat / Sauces (flags) / PizzaVariantId (the 5 fixed variant Guids) / Extra into
            // the unified Answers JSON, keyed by the reserved field keys. Options are omitted when
            // absent, so a döner line gets no $.variant, a pizza line no $.meat, etc. — mirroring
            // the LineAnswers serialiser exactly.
            migrationBuilder.Sql(
                @"UPDATE ""OrderLines""
                  SET ""Answers"" = json_set(""Answers"", '$.meat',
                      json_object('options', json_array(
                          CASE ""Meat"" WHEN 1 THEN 'kalb' WHEN 2 THEN 'haehnchen' WHEN 3 THEN 'gemischt' END)))
                  WHERE ""Meat"" IS NOT NULL;"
            );

            migrationBuilder.Sql(
                @"UPDATE ""OrderLines""
                  SET ""Answers"" = json_set(""Answers"", '$.sauce',
                      json_object('options', json((
                          SELECT json_group_array(k) FROM (
                              SELECT 'kraeuter' AS k, 1 AS ord WHERE (""Sauces"" & 1) <> 0
                              UNION ALL SELECT 'knoblauch', 2 WHERE (""Sauces"" & 2) <> 0
                              UNION ALL SELECT 'scharf', 3 WHERE (""Sauces"" & 4) <> 0
                              ORDER BY ord)))))
                  WHERE ""Sauces"" IS NOT NULL AND ""Sauces"" <> 0;"
            );

            // Pizza variants: every PizzaVariants row — the five canonical ones AND any variant an
            // admin added — becomes an option of the store's `variant` field, so no live order line
            // loses its variant and admin-added variants stay on the menu. Canonical ids take their
            // seed keys / price deltas (the GenericMenuSeeder then finds them present and leaves
            // them alone); admin-added ids get the stable key `v-<id>`. Ids are compared
            // lower-cased because EF's SQLite Guid mapping stores them upper-case.
            migrationBuilder.Sql(
                @"CREATE TEMP TABLE ""__variant_map"" AS
                  SELECT lower(""Id"") AS ""VariantId"",
                         CASE lower(""Id"")
                             WHEN 'b1a7c0de-0002-4a02-9a02-000000000002' THEN 'margherita'
                             WHEN 'b1a7c0de-0003-4a03-9a03-000000000003' THEN 'funghi'
                             WHEN 'b1a7c0de-0001-4a01-9a01-000000000001' THEN 'salami'
                             WHEN 'b1a7c0de-0004-4a04-9a04-000000000004' THEN 'tonno'
                             WHEN 'b1a7c0de-0005-4a05-9a05-000000000005' THEN 'hawaii'
                             ELSE 'v-' || lower(""Id"") END AS ""OptionKey"",
                         CASE lower(""Id"")
                             WHEN 'b1a7c0de-0002-4a02-9a02-000000000002' THEN 0
                             WHEN 'b1a7c0de-0003-4a03-9a03-000000000003' THEN 1
                             WHEN 'b1a7c0de-0001-4a01-9a01-000000000001' THEN 2
                             WHEN 'b1a7c0de-0004-4a04-9a04-000000000004' THEN 3
                             WHEN 'b1a7c0de-0005-4a05-9a05-000000000005' THEN 4
                             ELSE 5 END AS ""Rank"",
                         CASE lower(""Id"")
                             WHEN 'b1a7c0de-0001-4a01-9a01-000000000001' THEN 100
                             WHEN 'b1a7c0de-0004-4a04-9a04-000000000004' THEN 100
                             WHEN 'b1a7c0de-0005-4a05-9a05-000000000005' THEN 100
                             ELSE 0 END AS ""PriceDeltaCents"",
                         ""Name"", ""Icon"", ""IsAvailable""
                  FROM ""PizzaVariants"";"
            );

            migrationBuilder.Sql(
                @"INSERT INTO ""FieldDefinitions""
                      (""Id"", ""StoreId"", ""Key"", ""Label"", ""Type"", ""Display"", ""MaxLength"")
                  SELECT "
                    + NewGuidSql
                    + @", ""Id"", 'variant', 'Sorte', 1, 2, NULL
                  FROM ""Stores""
                  WHERE ""Key"" = 'schulz-doener'
                    AND EXISTS (SELECT 1 FROM ""__variant_map"");"
            );

            migrationBuilder.Sql(
                @"INSERT INTO ""FieldOptions""
                      (""Id"", ""FieldDefinitionId"", ""Key"", ""Label"", ""Icon"", ""PriceDeltaCents"",
                       ""SortOrder"", ""IsAvailable"")
                  SELECT "
                    + NewGuidSql
                    + @", field.""Id"", map.""OptionKey"", map.""Name"",
                         map.""Icon"", map.""PriceDeltaCents"",
                         ROW_NUMBER() OVER (ORDER BY map.""Rank"", map.""Name"") - 1,
                         map.""IsAvailable""
                  FROM ""__variant_map"" AS map
                  JOIN ""FieldDefinitions"" AS field ON field.""Key"" = 'variant'
                  JOIN ""Stores"" AS store
                    ON store.""Id"" = field.""StoreId"" AND store.""Key"" = 'schulz-doener';"
            );

            // A line whose variant id has no PizzaVariants row stays unmapped, so the VERIFY guard
            // below trips and the whole migration aborts rather than silently dropping its variant.
            migrationBuilder.Sql(
                @"UPDATE ""OrderLines""
                  SET ""Answers"" = json_set(""Answers"", '$.variant',
                      json_object('options', json_array(
                          (SELECT map.""OptionKey"" FROM ""__variant_map"" AS map
                           WHERE map.""VariantId"" = lower(""OrderLines"".""PizzaVariantId"")))))
                  WHERE ""PizzaVariantId"" IS NOT NULL
                    AND EXISTS (SELECT 1 FROM ""__variant_map"" AS map
                                WHERE map.""VariantId"" = lower(""OrderLines"".""PizzaVariantId""));"
            );

            migrationBuilder.Sql(@"DROP TABLE ""__variant_map"";");

            migrationBuilder.Sql(
                @"UPDATE ""OrderLines""
                  SET ""Answers"" = json_set(""Answers"", '$.extra', json_object('text', ""Extra""))
                  WHERE ""Extra"" IS NOT NULL AND trim(""Extra"") <> '';"
            );

            // ── VERIFY (aborts the whole transactional migration on any count mismatch) ─────────
            // A temp table with a CHECK(ok = 1): inserting ok = 0 raises a constraint failure that
            // rolls the migration back, so prod is never left half-migrated. The counts assert that
            // every populated typed value produced exactly one Answers key.
            migrationBuilder.Sql(
                @"CREATE TEMP TABLE ""__migration_guard"" (""ok"" INTEGER NOT NULL CHECK (""ok"" = 1));"
            );
            migrationBuilder.Sql(
                @"INSERT INTO ""__migration_guard"" (""ok"") SELECT CASE WHEN
                      (SELECT COUNT(*) FROM ""OrderLines"" WHERE ""Meat"" IS NOT NULL)
                        = (SELECT COUNT(*) FROM ""OrderLines"" WHERE json_extract(""Answers"", '$.meat') IS NOT NULL)
                  AND (SELECT COUNT(*) FROM ""OrderLines"" WHERE ""Sauces"" IS NOT NULL AND ""Sauces"" <> 0)
                        = (SELECT COUNT(*) FROM ""OrderLines"" WHERE json_extract(""Answers"", '$.sauce') IS NOT NULL)
                  AND (SELECT COUNT(*) FROM ""OrderLines"" WHERE ""PizzaVariantId"" IS NOT NULL)
                        = (SELECT COUNT(*) FROM ""OrderLines"" WHERE json_extract(""Answers"", '$.variant') IS NOT NULL)
                  AND (SELECT COUNT(*) FROM ""OrderLines"" WHERE ""Extra"" IS NOT NULL AND trim(""Extra"") <> '')
                        = (SELECT COUNT(*) FROM ""OrderLines"" WHERE json_extract(""Answers"", '$.extra') IS NOT NULL)
                      THEN 1 ELSE 0 END;"
            );
            migrationBuilder.Sql(@"DROP TABLE ""__migration_guard"";");

            // ── CONTRACT (drop the old columns / table, only after VERIFY passed) ──────────────
            // EF defers the OrderLines column drops to a table rebuild at the end of the migration,
            // so the old FK is still live when PizzaVariants is dropped below. Clear the (already
            // backfilled, about-to-be-dropped) references first, or the drop fails on any database
            // with a pizza order.
            migrationBuilder.Sql(
                @"UPDATE ""OrderLines"" SET ""PizzaVariantId"" = NULL WHERE ""PizzaVariantId"" IS NOT NULL;"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_OrderLines_PizzaVariants_PizzaVariantId",
                table: "OrderLines"
            );

            migrationBuilder.DropIndex(name: "IX_OrderLines_PizzaVariantId", table: "OrderLines");

            migrationBuilder.DropColumn(name: "Extra", table: "OrderLines");
            migrationBuilder.DropColumn(name: "Kind", table: "OrderLines");
            migrationBuilder.DropColumn(name: "Meat", table: "OrderLines");
            migrationBuilder.DropColumn(name: "PizzaVariantId", table: "OrderLines");
            migrationBuilder.DropColumn(name: "Sauces", table: "OrderLines");
            migrationBuilder.DropColumn(name: "Kind", table: "MenuItems");

            migrationBuilder.DropTable(name: "PizzaVariants");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_Categories_CategoryId",
                table: "MenuItems"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_MenuItems_BaseItemId",
                table: "MenuItems"
            );

            migrationBuilder.DropForeignKey(
                name: "FK_MenuItems_Stores_StoreId",
                table: "MenuItems"
            );

            migrationBuilder.DropTable(name: "CategoryFields");

            migrationBuilder.DropTable(name: "FieldOptions");

            migrationBuilder.DropTable(name: "Categories");

            migrationBuilder.DropTable(name: "FieldDefinitions");

            migrationBuilder.DropIndex(name: "IX_MenuItems_BaseItemId", table: "MenuItems");

            migrationBuilder.DropIndex(name: "IX_MenuItems_CategoryId", table: "MenuItems");

            migrationBuilder.DropIndex(name: "IX_MenuItems_StoreId", table: "MenuItems");

            migrationBuilder.DropColumn(name: "Answers", table: "OrderLines");

            migrationBuilder.DropColumn(name: "BaseItemId", table: "MenuItems");

            migrationBuilder.DropColumn(name: "CategoryId", table: "MenuItems");

            migrationBuilder.DropColumn(name: "DefaultAnswers", table: "MenuItems");

            migrationBuilder.DropColumn(name: "StoreId", table: "MenuItems");

            migrationBuilder.AddColumn<string>(
                name: "Extra",
                table: "OrderLines",
                type: "TEXT",
                maxLength: 256,
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "OrderLines",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<int>(
                name: "Meat",
                table: "OrderLines",
                type: "INTEGER",
                nullable: true
            );

            migrationBuilder.AddColumn<Guid>(
                name: "PizzaVariantId",
                table: "OrderLines",
                type: "TEXT",
                nullable: true
            );

            migrationBuilder.AddColumn<int>(
                name: "Sauces",
                table: "OrderLines",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "MenuItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0
            );

            migrationBuilder.CreateTable(
                name: "PizzaVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Icon = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    IsAvailable = table.Column<bool>(
                        type: "INTEGER",
                        nullable: false,
                        defaultValue: true
                    ),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PizzaVariants", x => x.Id);
                }
            );

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
    }
}
