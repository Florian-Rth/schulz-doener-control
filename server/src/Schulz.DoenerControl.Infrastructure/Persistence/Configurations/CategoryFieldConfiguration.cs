using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// The category↔field join. Unique on (CategoryId, FieldDefinitionId) so a field appears at most once
// per category. The FieldDefinition side is Restrict: a field referenced by any category can't be
// hard-deleted out from under it.
public sealed class CategoryFieldConfiguration : IEntityTypeConfiguration<CategoryField>
{
    public void Configure(EntityTypeBuilder<CategoryField> builder)
    {
        builder.ToTable("CategoryFields");
        builder.HasKey(link => link.Id);

        builder.HasIndex(link => new { link.CategoryId, link.FieldDefinitionId }).IsUnique();

        builder
            .HasOne(link => link.FieldDefinition)
            .WithMany()
            .HasForeignKey(link => link.FieldDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);

        // The Category → CategoryField relationship (with cascade) is configured on
        // CategoryConfiguration via HasMany(category => category.Fields).
    }
}
