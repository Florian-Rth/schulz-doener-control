using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.ToTable("OrderLines");
        builder.HasKey(line => line.Id);

        builder.Property(line => line.ProductId).HasMaxLength(32).IsRequired();
        builder.Property(line => line.Kind).HasConversion<int>();
        builder.Property(line => line.Meat).HasConversion<int>();

        // Sauce is a [Flags] enum stored as a bit-flags int.
        builder.Property(line => line.Sauces).HasConversion<int>();

        builder.Property(line => line.Extra).HasMaxLength(256);
        builder.Property(line => line.PriceCents);
        builder.Property(line => line.Quantity);

        // The header→lines cascade and the OrderId FK are configured on OrderConfiguration.
        builder
            .HasOne<MenuItem>()
            .WithMany()
            .HasForeignKey(line => line.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // A pizza line's variant is a nullable FK onto the admin-managed PizzaVariant catalog.
        // RESTRICT so a variant referenced by any (past) order can't be hard-deleted out from under
        // it; the admin delete path soft-retires a referenced variant instead.
        builder
            .HasOne(line => line.PizzaVariant)
            .WithMany()
            .HasForeignKey(line => line.PizzaVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
