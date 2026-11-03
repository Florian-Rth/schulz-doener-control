using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// Stores are editable reference data seeded at runtime (StoreSeeder), not migration-managed HasData,
// so admins can rename/reorder/retire them as ordinary rows. Key is the stable seed identity and is
// uniquely indexed.
public sealed class StoreConfiguration : IEntityTypeConfiguration<Store>
{
    public void Configure(EntityTypeBuilder<Store> builder)
    {
        builder.ToTable("Stores");
        builder.HasKey(store => store.Id);

        builder.Property(store => store.Key).HasMaxLength(64).IsRequired();
        builder.Property(store => store.Name).HasMaxLength(128).IsRequired();
        builder.Property(store => store.IsActive).HasDefaultValue(true);

        builder.HasIndex(store => store.Key).IsUnique();
    }
}
