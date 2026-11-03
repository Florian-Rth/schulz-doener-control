using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.ToTable("OrderLines");
        builder.HasKey(line => line.Id);

        builder.Property(line => line.ProductId).HasMaxLength(32).IsRequired();
        builder.Property(line => line.PriceCents);
        builder.Property(line => line.Quantity);

        // The unified answers payload replaces the old typed Meat/Sauces/PizzaVariantId columns.
        // Stored as JSON TEXT (SQLite has no jsonb), not null, defaulting to an empty object.
        builder
            .Property(line => line.Answers)
            .HasConversion(LineAnswersConverter.Instance)
            .HasDefaultValue(LineAnswers.Empty)
            .Metadata.SetValueComparer(LineAnswersConverter.Comparer);

        // The header→lines cascade and the OrderId FK are configured on OrderConfiguration.
        builder
            .HasOne<MenuItem>()
            .WithMany()
            .HasForeignKey(line => line.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
