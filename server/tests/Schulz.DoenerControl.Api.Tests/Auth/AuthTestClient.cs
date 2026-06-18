using System.Net.Http.Json;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// A thin cookie-aware wrapper over the harness HttpClient. The TestServer client keeps no cookie
// container, so this captures Set-Cookie values the server issues and replays them on subsequent
// requests — exactly mirroring how a browser carries the httpOnly auth cookies. This lets the
// integration tests prove the real cookie-borne JWT + CSRF double-submit wiring end to end.
public sealed class AuthTestClient
{
    private const string AccessCookieName = "dc_access";
    private const string RefreshCookieName = "dc_refresh";
    private const string XsrfCookieName = "dc_xsrf";
    private const string XsrfHeaderName = "X-XSRF-TOKEN";

    private readonly HttpClient client;
    private readonly string throttleKey;
    private readonly Dictionary<string, string> cookies = new(StringComparer.Ordinal);

    private string? xsrfHeaderOverride;

    public AuthTestClient(HttpClient client)
    {
        this.client = client;

        // FastEndpoints' Throttle keys by X-Forwarded-For. The TestServer gives every request the
        // same (empty) client IP, so without a per-client key the login/refresh rate-limit buckets
        // would be shared across all parallel test classes. A unique key per client isolates them;
        // a test that wants to trigger throttling simply reuses one client (one bucket).
        throttleKey = Guid.NewGuid().ToString("N");
    }

    // When set, mutating requests omit the X-XSRF-TOKEN header so a test can assert the CSRF guard
    // rejects a double-submit mismatch.
    public bool SuppressXsrfHeader { get; set; }

    public IReadOnlyDictionary<string, string> Cookies => cookies;

    public bool HasAccessCookie => cookies.ContainsKey(AccessCookieName);

    public bool HasRefreshCookie => cookies.ContainsKey(RefreshCookieName);

    public bool HasXsrfCookie => cookies.ContainsKey(XsrfCookieName);

    public string? XsrfValue => cookies.GetValueOrDefault(XsrfCookieName);

    public void ClearCookies() => cookies.Clear();

    public void OverrideCookie(string name, string value) => cookies[name] = value;

    // Forces a specific X-XSRF-TOKEN header value (e.g. one that does not match the cookie) so a
    // test can assert the double-submit guard rejects the mismatch.
    public void OverrideXsrfHeader(string value) => xsrfHeaderOverride = value;

    public async Task<HttpResponseMessage> PostJsonAsync(string url, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(body),
        };
        return await SendAsync(request);
    }

    public async Task<HttpResponseMessage> PostAsync(string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        return await SendAsync(request);
    }

    public async Task<HttpResponseMessage> GetAsync(string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        return await SendAsync(request);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request)
    {
        request.Headers.Add("X-Forwarded-For", throttleKey);
        AttachCookies(request);
        AttachXsrfHeader(request);
        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
        CaptureCookies(response);
        return response;
    }

    private void AttachCookies(HttpRequestMessage request)
    {
        if (cookies.Count == 0)
            return;

        var header = string.Join("; ", cookies.Select(pair => $"{pair.Key}={pair.Value}"));
        request.Headers.Add("Cookie", header);
    }

    private void AttachXsrfHeader(HttpRequestMessage request)
    {
        if (request.Method == HttpMethod.Get || SuppressXsrfHeader)
            return;

        if (xsrfHeaderOverride is not null)
        {
            request.Headers.Add(XsrfHeaderName, xsrfHeaderOverride);
            return;
        }

        if (cookies.TryGetValue(XsrfCookieName, out var token))
            request.Headers.Add(XsrfHeaderName, token);
    }

    private void CaptureCookies(HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var setCookies))
            return;

        foreach (var raw in setCookies)
        {
            var (name, value, expired) = ParseSetCookie(raw);
            if (name is null)
                continue;

            if (expired)
                cookies.Remove(name);
            else
                cookies[name] = value;
        }
    }

    private static (string? Name, string Value, bool Expired) ParseSetCookie(string raw)
    {
        var segments = raw.Split(';');
        var first = segments[0];
        var separator = first.IndexOf('=');
        if (separator < 0)
            return (null, string.Empty, false);

        var name = first[..separator].Trim();
        var value = first[(separator + 1)..].Trim();
        var expired = IsExpired(segments, value);
        return (name, value, expired);
    }

    private static bool IsExpired(string[] segments, string value)
    {
        if (value.Length == 0)
            return true;

        foreach (var segment in segments.Skip(1))
        {
            var trimmed = segment.Trim();
            if (
                trimmed.StartsWith("Max-Age=", StringComparison.OrdinalIgnoreCase)
                && trimmed.EndsWith("=0", StringComparison.Ordinal)
            )
            {
                return true;
            }

            if (
                trimmed.StartsWith("Expires=", StringComparison.OrdinalIgnoreCase)
                && DateTimeOffset.TryParse(trimmed["Expires=".Length..], out var expires)
                && expires <= DateTimeOffset.UtcNow
            )
            {
                return true;
            }
        }

        return false;
    }
}
