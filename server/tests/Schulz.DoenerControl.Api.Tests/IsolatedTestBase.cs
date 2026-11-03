using FastEndpoints.Testing;

namespace Schulz.DoenerControl.Api.Tests;

// Base for every integration test class: the fixture (one host + database per class) is shared by
// all tests in the class, so the database is reset to its freshly seeded snapshot before each test.
public abstract class IsolatedTestBase<TApp> : TestBase<TApp>
    where TApp : AppFixture<Program>, IResettableTestApp
{
    protected IsolatedTestBase(TApp app)
    {
        App = app;
    }

    protected TApp App { get; }

    protected override ValueTask SetupAsync()
    {
        App.ResetDatabase();
        return ValueTask.CompletedTask;
    }
}
