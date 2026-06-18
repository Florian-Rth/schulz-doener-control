using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class OrderDayConfiguration : IEntityTypeConfiguration<OrderDay>
{
    public void Configure(EntityTypeBuilder<OrderDay> builder)
    {
        builder.ToTable("OrderDays");
        builder.HasKey(day => day.Id);

        builder.Property(day => day.Status).HasConversion<int>();
        builder.Property(day => day.Synonym).HasMaxLength(64).IsRequired();

        // One OrderDay per calendar day.
        builder.HasIndex(day => day.Date).IsUnique();

        builder
            .HasOne(day => day.OpenedByUser)
            .WithMany()
            .HasForeignKey(day => day.OpenedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(day => day.CollectorUser)
            .WithMany()
            .HasForeignKey(day => day.CollectorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
