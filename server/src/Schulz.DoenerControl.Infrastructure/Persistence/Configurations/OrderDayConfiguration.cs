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

        // At most one active (non-closed) OrderDay per calendar day. A partial unique index whose
        // filter excludes OrderDayStatus.Closed (2): closed days don't count, so a new Döner-Tag can
        // be opened after the previous one is closed, while two simultaneous active days stay blocked.
        builder.HasIndex(day => day.Date).IsUnique().HasFilter("\"Status\" <> 2");

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
