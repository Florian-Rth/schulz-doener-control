using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// Categories are runtime-seeded editable reference data (GenericMenuSeeder), scoped to a store. Key
// is unique per store.
public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(category => category.Id);

        builder.Property(category => category.Key).HasMaxLength(64).IsRequired();
        builder.Property(category => category.Name).HasMaxLength(128).IsRequired();
        builder.Property(category => category.IsAvailable).HasDefaultValue(true);

        builder.HasIndex(category => new { category.StoreId, category.Key }).IsUnique();

        builder
            .HasOne(category => category.Store)
            .WithMany()
            .HasForeignKey(category => category.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(category => category.Fields)
            .WithOne(field => field.Category!)
            .HasForeignKey(field => field.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
