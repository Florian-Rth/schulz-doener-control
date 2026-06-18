using FastEndpoints.Testing;

namespace Schulz.DoenerControl.Api.Tests;

// Shared base for every integration test: binds the real-SQLite harness fixture and
// exposes it as App. Feature test classes inherit this to get a fresh, migrated,
// isolated SQLite database per class.
public abstract class DoenerControlTestBase : TestBase<DoenerControlApp>
{
    protected DoenerControlTestBase(DoenerControlApp app)
    {
        App = app;
    }

    protected DoenerControlApp App { get; }
}
