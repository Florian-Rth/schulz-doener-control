using Microsoft.Data.Sqlite;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Persistence;

public sealed class SqliteBusyTimeoutInterceptorTests
{
    [Fact]
    public async Task Should_Set_BusyTimeout_On_Connection_When_Applied()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        SqliteBusyTimeoutInterceptor.Apply(connection);

        await using var read = connection.CreateCommand();
        read.CommandText = "PRAGMA busy_timeout;";
        var value = Convert.ToInt32(
            await read.ExecuteScalarAsync(TestContext.Current.CancellationToken)
        );

        Assert.Equal(SqliteBusyTimeoutInterceptor.BusyTimeoutMilliseconds, value);
    }
}
