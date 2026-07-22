using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// The reusable field library, scoped to a store. Key is unique per store. Options cascade with the
// field; the field itself is referenced by categories only through CategoryField (no cascade from
// there — removing a category link never deletes the shared field).
public sealed class FieldDefinitionConfiguration : IEntityTypeConfiguration<FieldDefinition>
{
    public void Configure(EntityTypeBuilder<FieldDefinition> builder)
    {
        builder.ToTable("FieldDefinitions");
        builder.HasKey(field => field.Id);

        builder.Property(field => field.Key).HasMaxLength(64).IsRequired();
        builder.Property(field => field.Label).HasMaxLength(128).IsRequired();
        builder.Property(field => field.Type).HasConversion<int>();
        builder.Property(field => field.Display).HasConversion<int>();

        builder.HasIndex(field => new { field.StoreId, field.Key }).IsUnique();

        builder
            .HasOne(field => field.Store)
            .WithMany()
            .HasForeignKey(field => field.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(field => field.Options)
            .WithOne(option => option.FieldDefinition!)
            .HasForeignKey(option => option.FieldDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
