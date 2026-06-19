using System.Collections.Concurrent;
using Schulz.DoenerControl.Application.Push;

namespace Schulz.DoenerControl.Api.Tests.Push;

// Test double for the real Web Push HTTP transport. Records every send so integration tests can
// assert OpenDay fanned a push to the right subscribers with the right (synonym) payload — without
// ever touching a real browser push service. Registered as a singleton over the real transport in
// the push-specific test harness.
public sealed class RecordingWebPushTransport : IWebPushTransport
{
    private readonly ConcurrentQueue<RecordedPush> sends = new();

    public IReadOnlyList<RecordedPush> Sends => sends.ToArray();

    public Task SendAsync(WebPushTarget target, WebPushPayload payload, CancellationToken ct)
    {
        sends.Enqueue(new RecordedPush(target, payload));
        return Task.CompletedTask;
    }
}

public sealed record RecordedPush(WebPushTarget Target, WebPushPayload Payload);
