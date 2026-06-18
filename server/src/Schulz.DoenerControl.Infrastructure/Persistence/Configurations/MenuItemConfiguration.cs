using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("MenuItems");
        builder.HasKey(item => item.Id);

        builder.Property(item => item.Id).HasMaxLength(32);
        builder.Property(item => item.Name).HasMaxLength(64).IsRequired();
        builder.Property(item => item.MaterialIcon).HasMaxLength(64).IsRequired();
        builder.Property(item => item.Note).HasMaxLength(128);
        builder.Property(item => item.Kind).HasConversion<int>();

        builder.HasData(
            new MenuItem
            {
                Id = "doener",
                Name = "Döner",
                DefaultPriceCents = 750,
                Kind = ProductKind.Doener,
                MaterialIcon = "kebab_dining",
                Note = null,
                IsInsider = false,
                SortOrder = 1,
            },
            new MenuItem
            {
                Id = "duerum",
                Name = "Dürüm",
                DefaultPriceCents = 800,
                Kind = ProductKind.Doener,
                MaterialIcon = "wrap_text",
                Note = null,
                IsInsider = false,
                SortOrder = 2,
            },
            new MenuItem
            {
                Id = "big",
                Name = "Big Döner",
                DefaultPriceCents = 950,
                Kind = ProductKind.Doener,
                MaterialIcon = "lunch_dining",
                Note = null,
                IsInsider = false,
                SortOrder = 3,
            },
            new MenuItem
            {
                Id = "box",
                Name = "Dönerbox",
                DefaultPriceCents = 650,
                Kind = ProductKind.Doener,
                MaterialIcon = "takeout_dining",
                Note = null,
                IsInsider = false,
                SortOrder = 4,
            },
            new MenuItem
            {
                Id = "danny",
                Name = "Danny-Box",
                DefaultPriceCents = 600,
                Kind = ProductKind.Doener,
                MaterialIcon = "workspace_premium",
                Note = "Pommes · Fleisch · Soße",
                IsInsider = true,
                SortOrder = 5,
            },
            new MenuItem
            {
                Id = "pizza",
                Name = "Pizza",
                DefaultPriceCents = 900,
                Kind = ProductKind.Pizza,
                MaterialIcon = "local_pizza",
                Note = null,
                IsInsider = false,
                SortOrder = 6,
            }
        );
    }
}
