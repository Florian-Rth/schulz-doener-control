using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// The pizza variants are editable reference data: the 5 canonical rows are planted by the
// EditablePizzaVariants migration with fixed Guids, then managed as ordinary rows through the admin
// API. No HasData here — the migration owns the seed.
public sealed class PizzaVariantConfiguration : IEntityTypeConfiguration<PizzaVariant>
{
    public void Configure(EntityTypeBuilder<PizzaVariant> builder)
    {
        builder.ToTable("PizzaVariants");
        builder.HasKey(variant => variant.Id);

        builder.Property(variant => variant.Name).HasMaxLength(64).IsRequired();
        builder.Property(variant => variant.Icon).HasMaxLength(64);
        builder.Property(variant => variant.IsAvailable).HasDefaultValue(true);
    }
}
