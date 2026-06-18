using FastEndpoints.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Auth;

// Wires cookie-borne JWT auth, CORS-with-credentials, and the per-request auth helpers. The bearer
// token is read from the dc_access cookie (not the Authorization header) via OnMessageReceived, so
// the SPA never touches the JWT in JS. CORS allows credentials against an explicit origin allow-list
// from config (separate-origin deployment). Endpoints are secured by default; only login/refresh
// opt out with AllowAnonymous.
public static class AuthSetup
{
    public const string CorsPolicyName = "DoenerControlSpa";

    private const string CorsOriginsKey = "Auth:AllowedOrigins";

    public static IServiceCollection AddDoenerAuth(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        services
            .AddOptions<AccessTokenOptions>()
            .Bind(configuration.GetSection(AccessTokenOptions.SectionKey));

        services
            .AddOptions<AccessTokenOptions>()
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.JwtSigningKey),
                "'Auth:JwtSigningKey' must be configured with a non-empty signing key."
            )
            .ValidateOnStart();

        var tokenOptions = ReadTokenOptions(configuration);

        services.AddAuthenticationJwtBearer(
            signing => signing.SigningKey = tokenOptions.JwtSigningKey,
            bearer => ConfigureBearer(bearer, tokenOptions)
        );
        services.AddAuthorization();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<AccessTokenIssuer>();
        services.AddSingleton(new AuthCookies(secure: !environment.IsDevelopment()));
        services.AddSingleton<AuthSessionWriter>();

        services.AddCors(options =>
            options.AddPolicy(
                CorsPolicyName,
                policy =>
                    policy
                        .WithOrigins(ReadAllowedOrigins(configuration))
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
            )
        );

        return services;
    }

    private static void ConfigureBearer(JwtBearerOptions bearer, AccessTokenOptions tokenOptions)
    {
        bearer.TokenValidationParameters.ValidateIssuer = !string.IsNullOrWhiteSpace(
            tokenOptions.JwtIssuer
        );
        bearer.TokenValidationParameters.ValidIssuer = tokenOptions.JwtIssuer;
        bearer.TokenValidationParameters.ValidateAudience = !string.IsNullOrWhiteSpace(
            tokenOptions.JwtAudience
        );
        bearer.TokenValidationParameters.ValidAudience = tokenOptions.JwtAudience;
        bearer.TokenValidationParameters.ClockSkew = TimeSpan.FromSeconds(30);

        bearer.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies[AuthCookies.AccessCookie];
                return Task.CompletedTask;
            },
        };
    }

    private static AccessTokenOptions ReadTokenOptions(IConfiguration configuration)
    {
        var section = configuration.GetSection(AccessTokenOptions.SectionKey);
        return new AccessTokenOptions
        {
            JwtSigningKey = section["JwtSigningKey"] ?? string.Empty,
            JwtIssuer = section["JwtIssuer"] ?? string.Empty,
            JwtAudience = section["JwtAudience"] ?? string.Empty,
        };
    }

    private static string[] ReadAllowedOrigins(IConfiguration configuration)
    {
        var configured = configuration.GetSection(CorsOriginsKey).Get<string[]>();

        if (configured is { Length: > 0 })
            return configured;

        var single = configuration[CorsOriginsKey];
        return string.IsNullOrWhiteSpace(single)
            ? Array.Empty<string>()
            : single.Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
            );
    }
}
