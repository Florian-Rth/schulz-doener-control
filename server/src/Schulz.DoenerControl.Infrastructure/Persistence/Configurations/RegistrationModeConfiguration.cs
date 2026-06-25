using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class RegistrationModeConfiguration : IEntityTypeConfiguration<RegistrationMode>
{
    public void Configure(EntityTypeBuilder<RegistrationMode> builder)
    {
        builder.ToTable("RegistrationMode");
        builder.HasKey(mode => mode.Id);
        builder.Property(mode => mode.Mode).IsRequired();
        builder.Property(mode => mode.SecretKey).HasMaxLength(128);
        builder.Property(mode => mode.UpdatedAt).IsRequired();
    }
}
