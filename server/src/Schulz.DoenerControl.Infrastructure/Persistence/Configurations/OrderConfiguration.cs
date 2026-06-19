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

        // The order total is derived from the lines, never stored.
        builder.Ignore(order => order.TotalCents);

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
            .HasMany(order => order.Lines)
            .WithOne(line => line.Order)
            .HasForeignKey(line => line.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
