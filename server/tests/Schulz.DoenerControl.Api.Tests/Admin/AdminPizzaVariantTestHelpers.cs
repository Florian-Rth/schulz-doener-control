using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Shared helpers for the pizza-variant tests: the canonical seeded ids (the EditablePizzaVariants
// migration plants these with fixed Guids) and DbContext reads the scenarios assert on. Admin /
// employee logins reuse the user-management helpers.
internal static class AdminPizzaVariantTestHelpers
{
    public const string VariantsUrl = "/api/admin/pizza-variants";

    // The canonical Salami variant id (SortOrder 1). Pizza-order scenarios submit this as the
    // pizza line's wire value; the label resolves to "Pizza Salami".
    public const string SalamiId = "b1a7c0de-0001-4a01-9a01-000000000001";
    public const string MargheritaId = "b1a7c0de-0002-4a02-9a02-000000000002";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    public static async Task<PizzaVariant?> FindAsync(DoenerControlApp app, Guid id)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .PizzaVariants.AsNoTracking()
            .FirstOrDefaultAsync(variant => variant.Id == id, Ct);
    }

    public static async Task<int> CountAsync(DoenerControlApp app)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.PizzaVariants.CountAsync(Ct);
    }
}
