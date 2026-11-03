using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// One selectable option of a select field. Key is unique per field (the stable wire value an answer
// carries).
public sealed class FieldOptionConfiguration : IEntityTypeConfiguration<FieldOption>
{
    public void Configure(EntityTypeBuilder<FieldOption> builder)
    {
        builder.ToTable("FieldOptions");
        builder.HasKey(option => option.Id);

        builder.Property(option => option.Key).HasMaxLength(64).IsRequired();
        builder.Property(option => option.Label).HasMaxLength(128).IsRequired();
        builder.Property(option => option.Icon).HasMaxLength(64);
        builder.Property(option => option.IsAvailable).HasDefaultValue(true);

        builder.HasIndex(option => new { option.FieldDefinitionId, option.Key }).IsUnique();
    }
}
