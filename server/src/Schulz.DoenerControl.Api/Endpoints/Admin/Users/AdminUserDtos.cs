using Schulz.DoenerControl.Application.Users;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

// Endpoint-layer projection of one managed account, shared by the list and update responses. Role
// is rendered as its string name ("Admin"/"Employee") to match the rest of the API surface; mapped
// from the Application AdminUserSummary so the service type never leaks across the boundary.
public sealed record AdminUserSummaryDto(
    Guid Id,
    string Username,
    string DisplayName,
    string Role,
    bool IsActive,
    bool MustChangePassword,
    string? PayPalHandle,
    DateTimeOffset CreatedAt
);

public static class AdminUserMapper
{
    public static AdminUserSummaryDto ToSummaryDto(AdminUserSummary summary) =>
        new(
            summary.Id,
            summary.Username,
            summary.DisplayName,
            summary.Role.ToString(),
            summary.IsActive,
            summary.MustChangePassword,
            summary.PayPalHandle,
            summary.CreatedAt
        );
}
