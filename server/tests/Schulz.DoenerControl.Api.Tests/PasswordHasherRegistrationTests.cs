using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Application.Security;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Proves IPasswordHasher is wired into the real host (resolves from DI, options bound from the
// test host config + validated at startup) and round-trips through the actual configured pepper.
public sealed class PasswordHasherRegistrationTests : DoenerControlTestBase
{
    public PasswordHasherRegistrationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public void Should_Resolve_PasswordHasher_From_Host()
    {
        using var scope = App.Services.CreateScope();

        var hasher = scope.ServiceProvider.GetService<IPasswordHasher>();

        Assert.NotNull(hasher);
    }

    [Fact]
    public void Should_RoundTrip_Hash_And_Verify_Through_Configured_Pepper()
    {
        using var scope = App.Services.CreateScope();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var result = hasher.Hash("EinFrischesPasswort1");

        Assert.True(hasher.Verify("EinFrischesPasswort1", result.Hash, result.Salt));
        Assert.False(hasher.Verify("FalschesPasswort2", result.Hash, result.Salt));
    }
}
