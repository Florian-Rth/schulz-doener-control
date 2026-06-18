using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class DebtConfiguration : IEntityTypeConfiguration<Debt>
{
    public void Configure(EntityTypeBuilder<Debt> builder)
    {
        builder.ToTable("Debts");
        builder.HasKey(debt => debt.Id);

        builder.Property(debt => debt.Reason).HasMaxLength(128).IsRequired();
        builder.Property(debt => debt.Status).HasConversion<int>();

        // Two User FKs (debtor / creditor) plus optional Order / OrderDay links: all
        // Restrict to avoid SQLite multiple-cascade-path errors. Users are deactivated,
        // not hard-deleted.
        builder
            .HasOne(debt => debt.DebtorUser)
            .WithMany()
            .HasForeignKey(debt => debt.DebtorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(debt => debt.CreditorUser)
            .WithMany()
            .HasForeignKey(debt => debt.CreditorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(debt => debt.Order)
            .WithMany()
            .HasForeignKey(debt => debt.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(debt => debt.OrderDay)
            .WithMany()
            .HasForeignKey(debt => debt.OrderDayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
