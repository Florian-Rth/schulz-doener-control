using System.Security.Claims;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Auth;

// Resolves the authenticated caller from the validated JWT claims via IHttpContextAccessor, so
// Application services receive the caller id without ever touching HttpContext. Registered scoped.
public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        this.httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId
    {
        get
        {
            var raw = Principal?.FindFirstValue(AuthClaims.Subject);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;
}
