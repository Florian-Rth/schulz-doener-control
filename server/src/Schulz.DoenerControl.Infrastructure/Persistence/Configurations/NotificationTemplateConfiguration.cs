using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

public sealed class NotificationTemplateConfiguration
    : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NotificationTemplates");
        builder.HasKey(template => template.Id);
        builder.Property(template => template.Synonym).HasMaxLength(64).IsRequired();
        builder.Property(template => template.Body).HasMaxLength(280).IsRequired();
        builder.Property(template => template.IsActive).HasDefaultValue(true);
    }
}
