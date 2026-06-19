using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Push;

// The W3C PushSubscription.toJSON() wire shape the browser POSTs verbatim: the endpoint URL, an
// optional expiry the FE forwards but the server ignores, and the encryption keys nested under
// `keys` (p256dh + auth).
public sealed class PostPushSubscriptionRequest
{
    public string Endpoint { get; set; } = string.Empty;

    public long? ExpirationTime { get; set; }

    public PushSubscriptionKeysDto Keys { get; set; } = new();
}

public sealed class PushSubscriptionKeysDto
{
    public string P256dh { get; set; } = string.Empty;

    public string Auth { get; set; } = string.Empty;
}

// The persisted subscription's endpoint, echoed back so the FE can parse the body
// (PushSubscriptionResponseSchema = { endpoint }).
public sealed record PostPushSubscriptionResponse(string Endpoint);

public sealed class PostPushSubscriptionRequestValidator : Validator<PostPushSubscriptionRequest>
{
    public PostPushSubscriptionRequestValidator()
    {
        RuleFor(request => request.Endpoint).NotEmpty().MaximumLength(512);
        RuleFor(request => request.Keys).NotNull();
        RuleFor(request => request.Keys.P256dh).NotEmpty().MaximumLength(256);
        RuleFor(request => request.Keys.Auth).NotEmpty().MaximumLength(256);
    }
}

// Stores (upserts) the caller's browser Web Push subscription so OpenDay can fan a push to them.
// Idempotent on the endpoint key; returns 200 with the stored endpoint. Authenticated.
public sealed class PostPushSubscription
    : Endpoint<PostPushSubscriptionRequest, PostPushSubscriptionResponse>
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

        var command = new SavePushSubscriptionCommand(
            callerId,
            req.Endpoint,
            req.Keys.P256dh,
            req.Keys.Auth
        );
        var result = await subscriptionService.SubscribeAsync(command, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(new PostPushSubscriptionResponse(req.Endpoint), cancellation: ct);
    }
}
