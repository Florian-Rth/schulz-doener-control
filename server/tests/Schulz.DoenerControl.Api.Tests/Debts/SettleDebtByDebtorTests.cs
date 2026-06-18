using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: the debtor settles their generated Döner-Tag debt → Settled + SettledAt stamped.
public sealed class SettleDebtByDebtorTests : DoenerControlTestBase
{
    public SettleDebtByDebtorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_MarkSettledAndSetSettledAt_When_DebtorSettles()
    {
        var (lukas, debtId) = await DebtTestHelpers.CreateDebtToChefAsync(App);

        var response = await lukas.PostAsync($"/api/debts/{debtId}/settle");
        var body = await response.Content.ReadFromJsonAsync<SettleDebtResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Settled", body!.Debt.Status);
        Assert.NotNull(body.Debt.SettledAt);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var debt = await database.Debts.SingleAsync(
            d => d.Id == debtId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(PaymentStatus.Settled, debt.Status);
        Assert.NotNull(debt.SettledAt);
    }
}
