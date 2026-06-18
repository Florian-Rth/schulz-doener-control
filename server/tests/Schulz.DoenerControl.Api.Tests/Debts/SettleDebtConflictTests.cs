using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Own fresh DB: settling an already-settled debt is a 409 conflict.
public sealed class SettleDebtConflictTests : DoenerControlTestBase
{
    public SettleDebtConflictTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return409_When_AlreadySettled()
    {
        var (lukas, debtId) = await DebtTestHelpers.CreateDebtToChefAsync(App);
        await lukas.PostAsync($"/api/debts/{debtId}/settle");

        var second = await lukas.PostAsync($"/api/debts/{debtId}/settle");

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
