using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// The menu is editable reference data, not migration-managed seed data: the canonical rows are
// planted at runtime by MenuSeeder (idempotent), so admins can create, edit and retire items as
// ordinary rows. Hence no HasData here.
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
        builder.Property(item => item.IsAvailable).HasDefaultValue(true);
    }
}
