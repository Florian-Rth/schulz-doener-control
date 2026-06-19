using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Push;

public sealed class DeletePushSubscriptionRequest
{
    // The FE sends the endpoint as ?endpoint=... ; FastEndpoints binds DELETE query params when the
    // property is annotated, so the NotEmpty validator below sees the real value.
    [QueryParam]
    public string Endpoint { get; set; } = string.Empty;
}

public sealed class DeletePushSubscriptionRequestValidator
    : Validator<DeletePushSubscriptionRequest>
{
    public DeletePushSubscriptionRequestValidator()
    {
        RuleFor(request => request.Endpoint).NotEmpty().MaximumLength(512);
    }
}

// Removes the caller's push subscription for the given endpoint (e.g. on logout / permission revoke).
// Idempotent and caller-scoped; returns 204. Authenticated.
public sealed class DeletePushSubscription : Endpoint<DeletePushSubscriptionRequest>
{
    private readonly IPushSubscriptionService subscriptionService;
    private readonly ICurrentUser currentUser;

    public DeletePushSubscription(
        IPushSubscriptionService subscriptionService,
        ICurrentUser currentUser
    )
    {
        this.subscriptionService = subscriptionService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Delete("/api/push/subscriptions");
    }

    public override async Task HandleAsync(DeletePushSubscriptionRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new RemovePushSubscriptionCommand(callerId, req.Endpoint);
        var result = await subscriptionService.UnsubscribeAsync(command, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
