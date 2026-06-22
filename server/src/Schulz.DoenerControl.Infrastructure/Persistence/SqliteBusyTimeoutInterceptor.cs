using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Schulz.DoenerControl.Infrastructure.Persistence;

// EF opens a fresh connection per operation, and by default SQLite throws "database is locked"
// immediately on contention (e.g. the first request racing the startup WAL checkpoint, or parallel
// dashboard queries). Setting a busy_timeout makes the SQLite engine WAIT for the lock to clear
// instead of failing, which eliminates those transient connection errors.
public sealed class SqliteBusyTimeoutInterceptor : DbConnectionInterceptor
{
    public const int BusyTimeoutMilliseconds = 5000;

    private static readonly string PragmaText = $"PRAGMA busy_timeout={BusyTimeoutMilliseconds};";

    public static void Apply(DbConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = PragmaText;
        command.ExecuteNonQuery();
    }

    public static async Task ApplyAsync(DbConnection connection, CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = PragmaText;
        await command.ExecuteNonQueryAsync(ct);
    }

    public override void ConnectionOpened(
        DbConnection connection,
        ConnectionEndEventData eventData
    ) => Apply(connection);

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default
    ) => await ApplyAsync(connection, cancellationToken);
}
