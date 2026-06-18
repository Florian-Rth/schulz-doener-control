using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.ToTable("PushSubscriptions");
        builder.HasKey(subscription => subscription.Id);

        builder.Property(subscription => subscription.Endpoint).HasMaxLength(512).IsRequired();
        builder.Property(subscription => subscription.P256dh).HasMaxLength(256).IsRequired();
        builder.Property(subscription => subscription.Auth).HasMaxLength(256).IsRequired();

        builder.HasIndex(subscription => subscription.Endpoint).IsUnique();

        builder
            .HasOne(subscription => subscription.User)
            .WithMany()
            .HasForeignKey(subscription => subscription.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
