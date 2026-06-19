using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Push;

public sealed class PostPushSubscriptionRequest
{
    public string Endpoint { get; set; } = string.Empty;

    public string P256dh { get; set; } = string.Empty;

    public string Auth { get; set; } = string.Empty;
}

public sealed class PostPushSubscriptionRequestValidator : Validator<PostPushSubscriptionRequest>
{
    public PostPushSubscriptionRequestValidator()
    {
        RuleFor(request => request.Endpoint).NotEmpty().MaximumLength(512);
        RuleFor(request => request.P256dh).NotEmpty().MaximumLength(256);
        RuleFor(request => request.Auth).NotEmpty().MaximumLength(256);
    }
}

// Stores (upserts) the caller's browser Web Push subscription so OpenDay can fan a push to them.
// Idempotent on the endpoint key; returns 204. Authenticated.
public sealed class PostPushSubscription : Endpoint<PostPushSubscriptionRequest>
{
    private readonly IPushSubscriptionService subscriptionService;
    private readonly ICurrentUser currentUser;

    public PostPushSubscription(
        IPushSubscriptionService subscriptionService,
        ICurrentUser currentUser
    )
    {
        this.subscriptionService = subscriptionService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/push/subscriptions");
    }

    public override async Task HandleAsync(PostPushSubscriptionRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new SavePushSubscriptionCommand(callerId, req.Endpoint, req.P256dh, req.Auth);
        var result = await subscriptionService.SubscribeAsync(command, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
