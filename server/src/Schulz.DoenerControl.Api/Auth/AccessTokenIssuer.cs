using FastEndpoints.Security;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Auth;

// Mints the short-lived access JWT (HMAC-SHA256) carrying the minimal claim set the API trusts.
// Lifetime is ~15 minutes; the SPA silently refreshes via the rotating refresh cookie. The clock
// is injected so token expiry is deterministic in tests.
public sealed class AccessTokenIssuer
{
    public static readonly TimeSpan AccessLifetime = TimeSpan.FromMinutes(15);

    private readonly AccessTokenOptions options;
    private readonly TimeProvider timeProvider;

    public AccessTokenIssuer(IOptions<AccessTokenOptions> options, TimeProvider timeProvider)
    {
        this.options = options.Value;
        this.timeProvider = timeProvider;
    }

    public IssuedAccessToken Issue(AuthenticatedUserDetails user)
    {
        var expiresAt = timeProvider.GetUtcNow() + AccessLifetime;
        var jwt = JwtBearer.CreateToken(creation =>
        {
            creation.SigningKey = options.JwtSigningKey;
            creation.Issuer = options.JwtIssuer;
            creation.Audience = options.JwtAudience;
            creation.ExpireAt = expiresAt.UtcDateTime;
            // Role goes in via User.Roles so FastEndpoints' Roles("admin") authorization works; the
            // role claim type is owned by FE, so we do not also add a duplicate "role" claim here.
            creation.User.Roles.Add(user.Role.ToString());
            creation.User.Claims.Add((AuthClaims.Subject, user.UserId.ToString()));
            creation.User.Claims.Add((AuthClaims.Username, user.Username));
            creation.User.Claims.Add((AuthClaims.DisplayName, user.DisplayName));
            creation.User.Claims.Add(
                (AuthClaims.MustChangePassword, user.MustChangePassword ? "true" : "false")
            );
        });

        return new IssuedAccessToken(jwt, expiresAt);
    }
}

public sealed record IssuedAccessToken(string Jwt, DateTimeOffset ExpiresAt);
