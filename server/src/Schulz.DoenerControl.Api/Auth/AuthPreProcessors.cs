using FastEndpoints;

namespace Schulz.DoenerControl.Api.Auth;

// Decides, at endpoint-registration time, which auth pre-processors apply to an endpoint. Doing the
// anonymous/verb decision here (against the EndpointDefinition) avoids fragile runtime metadata
// lookups inside the processors and keeps login/refresh free of the CSRF + forced-change gates.
public static class AuthPreProcessors
{
    public static void Apply(EndpointDefinition endpoint)
    {
        if (IsFullyAnonymous(endpoint))
            return;

        endpoint.PreProcessor<MustChangePasswordGate>(Order.Before);
        endpoint.PreProcessor<CsrfPreProcessor>(Order.Before);
    }

    private static bool IsFullyAnonymous(EndpointDefinition endpoint)
    {
        var anonymousVerbs = endpoint.AnonymousVerbs;
        if (anonymousVerbs is null || anonymousVerbs.Length == 0)
            return false;

        var verbs = endpoint.Verbs ?? Array.Empty<string>();
        return verbs.All(verb => anonymousVerbs.Contains(verb, StringComparer.OrdinalIgnoreCase));
    }
}
