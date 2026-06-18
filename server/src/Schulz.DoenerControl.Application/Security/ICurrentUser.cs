namespace Schulz.DoenerControl.Application.Security;

// Scoped accessor for the authenticated caller, resolved from the validated JWT claims. Lets
// Application services receive the caller identity without ever touching HttpContext, so they stay
// framework-agnostic and trivially fakeable. Never trust a user id taken from a request body.
public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    Guid? UserId { get; }
}
