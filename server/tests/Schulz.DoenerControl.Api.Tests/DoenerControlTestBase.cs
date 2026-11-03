namespace Schulz.DoenerControl.Api.Tests;

// Shared base for the default real-SQLite harness: each test starts from the freshly migrated and
// seeded database of its class's fixture.
public abstract class DoenerControlTestBase : IsolatedTestBase<DoenerControlApp>
{
    protected DoenerControlTestBase(DoenerControlApp app)
        : base(app) { }
}
