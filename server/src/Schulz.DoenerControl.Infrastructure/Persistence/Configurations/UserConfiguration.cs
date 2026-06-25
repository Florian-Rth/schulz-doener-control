using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(user => user.Id);

        builder.Property(user => user.Username).HasMaxLength(64).IsRequired();
        builder.Property(user => user.NormalizedUserName).HasMaxLength(64).IsRequired();
        builder.Property(user => user.DisplayName).HasMaxLength(128).IsRequired();
        builder.Property(user => user.PayPalHandle).HasMaxLength(256);
        builder.Property(user => user.PasswordHash).IsRequired();
        builder.Property(user => user.PasswordSalt).IsRequired();
        builder.Property(user => user.Role).HasConversion<int>();
        builder.Property(user => user.AvatarColorHex).HasMaxLength(9).IsRequired();

        builder.HasIndex(user => user.NormalizedUserName).IsUnique();
        builder.HasIndex(user => user.Username).IsUnique();
    }
}
