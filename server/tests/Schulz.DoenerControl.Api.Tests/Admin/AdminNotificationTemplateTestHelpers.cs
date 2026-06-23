using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Shared helpers for the admin notification-template integration tests: DbContext reads the
// scenarios assert on. Admin/employee logins reuse the user-management helpers.
internal static class AdminNotificationTemplateTestHelpers
{
    public const string TemplatesUrl = "/api/admin/notification-templates";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    public static async Task<NotificationTemplate?> FindAsync(DoenerControlApp app, Guid id)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .NotificationTemplates.AsNoTracking()
            .FirstOrDefaultAsync(template => template.Id == id, Ct);
    }

    public static async Task<int> CountAsync(DoenerControlApp app)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.NotificationTemplates.CountAsync(Ct);
    }

    public static async Task<Guid> FirstTemplateIdAsync(DoenerControlApp app)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var template = await database
            .NotificationTemplates.AsNoTracking()
            .OrderBy(row => row.Synonym)
            .FirstAsync(Ct);
        return template.Id;
    }
}
