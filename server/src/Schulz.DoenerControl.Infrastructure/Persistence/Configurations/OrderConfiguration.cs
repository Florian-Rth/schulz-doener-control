using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(order => order.Id);

        builder.Property(order => order.ProductId).HasMaxLength(32).IsRequired();
        builder.Property(order => order.Kind).HasConversion<int>();
        builder.Property(order => order.Meat).HasConversion<int>();
        builder.Property(order => order.PizzaVariant).HasConversion<int>();

        // Sauce is a [Flags] enum stored as a bit-flags int.
        builder.Property(order => order.Sauces).HasConversion<int>();

        builder.Property(order => order.Extra).HasMaxLength(256);

        // One order per user per day; supports upsert until cutoff.
        builder.HasIndex(order => new { order.OrderDayId, order.UserId }).IsUnique();

        builder
            .HasOne(order => order.OrderDay)
            .WithMany(day => day.Orders)
            .HasForeignKey(order => order.OrderDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(order => order.User)
            .WithMany(user => user.Orders)
            .HasForeignKey(order => order.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne<MenuItem>()
            .WithMany()
            .HasForeignKey(order => order.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
