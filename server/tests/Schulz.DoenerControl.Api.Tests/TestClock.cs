using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Schulz.DoenerControl.Api.Tests;

// Replaces the host's TimeProvider with the deterministic FixedTimeProvider and points JWT lifetime
// validation at the same instant. Infrastructure DI registers TimeProvider.System via
// TryAddSingleton; this override runs in the test host's ConfigureServices (after the app's DI) so
// it wins. JWT bearer validation otherwise checks token expiry against the real wall clock, which
// would reject tokens the server issues from the fixed (past) clock — so the validation parameters
// are pinned to the same provider.
public static class TestClock
{
    private static readonly FixedTimeProvider Provider = new();

    public static void Override(IServiceCollection services)
    {
        services.RemoveAll<TimeProvider>();
        services.AddSingleton<TimeProvider>(Provider);

        // The bundled Microsoft.IdentityModel validates token lifetime against the wall clock, with
        // no injectable clock on this version. Disable the built-in lifetime check and re-implement
        // it against the fixed instant so tokens the server issues from that same clock validate as
        // fresh instead of looking expired against the wall clock.
        services.PostConfigureAll<JwtBearerOptions>(options =>
            options.TokenValidationParameters.LifetimeValidator = ValidateLifetimeAgainstFixedClock
        );
    }

    // Validates only that the token has not expired relative to the fixed clock. The token's
    // expiry is stamped from the injected (fixed) TimeProvider, but FastEndpoints stamps nbf/iat
    // from the wall clock, so nbf is deliberately not checked here — against the fixed (past) clock
    // a wall-clock nbf reads as "not yet valid", which is meaningless in a deterministic test.
    private static bool ValidateLifetimeAgainstFixedClock(
        DateTime? notBefore,
        DateTime? expires,
        SecurityToken securityToken,
        TokenValidationParameters validationParameters
    )
    {
        var now = FixedTimeProvider.Instant.UtcDateTime;
        var skew = validationParameters.ClockSkew;
        return expires is not { } exp || exp >= now - skew;
    }
}
