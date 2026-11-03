using Microsoft.Data.Sqlite;

namespace Schulz.DoenerControl.Api.Tests;

// One fixture's private in-memory SQLite database plus a snapshot of its freshly seeded state.
// A shared-cache in-memory DB lives only while at least one connection is open — the keep-alive
// connection guarantees that for the fixture lifetime, and EF's per-request connections join the
// same cache by name. Restoring the snapshot before each test keeps tests within one class from
// observing each other's writes, independent of the order xUnit runs them in.
public sealed class SqliteTestDatabase : IDisposable
{
    private readonly SqliteConnection keepAliveConnection;
    private readonly SqliteConnection snapshotConnection = new("Data Source=:memory:");
    private bool hasSnapshot;

    public SqliteTestDatabase(string namePrefix)
    {
        ConnectionString = new SqliteConnectionStringBuilder
        {
            DataSource = $"{namePrefix}-{Guid.NewGuid():N}.db",
            Mode = SqliteOpenMode.Memory,
            Cache = SqliteCacheMode.Shared,
        }.ToString();
        keepAliveConnection = new SqliteConnection(ConnectionString);
    }

    public string ConnectionString { get; }

    public void Open()
    {
        keepAliveConnection.Open();
        snapshotConnection.Open();
    }

    public void CaptureSnapshot()
    {
        keepAliveConnection.BackupDatabase(snapshotConnection);
        hasSnapshot = true;
    }

    public void RestoreSnapshot()
    {
        if (!hasSnapshot)
        {
            throw new InvalidOperationException(
                "No snapshot captured — call CaptureSnapshot first."
            );
        }

        snapshotConnection.BackupDatabase(keepAliveConnection);
    }

    public void Dispose()
    {
        keepAliveConnection.Dispose();
        snapshotConnection.Dispose();
    }
}
