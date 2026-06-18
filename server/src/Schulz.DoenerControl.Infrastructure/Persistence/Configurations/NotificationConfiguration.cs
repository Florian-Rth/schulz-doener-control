using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(notification => notification.Id);

        builder.Property(notification => notification.Title).HasMaxLength(128).IsRequired();
        builder.Property(notification => notification.Body).HasMaxLength(512).IsRequired();

        builder
            .HasOne(notification => notification.RecipientUser)
            .WithMany()
            .HasForeignKey(notification => notification.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(notification => notification.OrderDay)
            .WithMany()
            .HasForeignKey(notification => notification.OrderDayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
