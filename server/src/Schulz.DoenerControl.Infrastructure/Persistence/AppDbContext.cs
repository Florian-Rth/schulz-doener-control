using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();

    public DbSet<Store> Stores => Set<Store>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<FieldDefinition> FieldDefinitions => Set<FieldDefinition>();

    public DbSet<FieldOption> FieldOptions => Set<FieldOption>();

    public DbSet<CategoryField> CategoryFields => Set<CategoryField>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<OrderDay> OrderDays => Set<OrderDay>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderLine> OrderLines => Set<OrderLine>();

    public DbSet<Debt> Debts => Set<Debt>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();

    public DbSet<RegistrationMode> RegistrationMode => Set<RegistrationMode>();

    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    public DbSet<GameScore> GameScores => Set<GameScore>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
