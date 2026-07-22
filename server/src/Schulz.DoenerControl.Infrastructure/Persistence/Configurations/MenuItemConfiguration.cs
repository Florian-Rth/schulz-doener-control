using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// The menu is editable reference data, not migration-managed seed data: the canonical rows are
// planted at runtime by GenericMenuSeeder (idempotent), so admins can create, edit and retire items
// as ordinary rows. Hence no HasData here. The former Kind enum is gone — an item's fields come from
// its Category.
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
        builder.Property(item => item.BaseItemId).HasMaxLength(32);
        builder.Property(item => item.IsAvailable).HasDefaultValue(true);

        // Nullable property: the non-generic overload takes the non-null converter and lets EF map
        // null column ↔ null value. A null default-answers means "ordinary item, no preset seed".
        builder
            .Property(item => item.DefaultAnswers)
            .HasConversion((ValueConverter)LineAnswersConverter.Instance)
            .Metadata.SetValueComparer(LineAnswersConverter.Comparer);

        builder
            .HasOne(item => item.Store)
            .WithMany()
            .HasForeignKey(item => item.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(item => item.Category)
            .WithMany()
            .HasForeignKey(item => item.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Preset "prints-as" pointer: a self-FK onto the base item. Restrict so a base item that any
        // preset references can't be hard-deleted out from under it.
        builder
            .HasOne(item => item.BaseItem)
            .WithMany()
            .HasForeignKey(item => item.BaseItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
