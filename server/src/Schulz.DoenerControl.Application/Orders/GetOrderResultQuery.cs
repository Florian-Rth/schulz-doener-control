namespace Schulz.DoenerControl.Application.Orders;

// Reads the success-screen summary for one order. The order must belong to the caller (else
// NotFound — don't leak other people's orders).
public sealed record GetOrderResultQuery(Guid CallerUserId, Guid OrderId);
