using Microsoft.Extensions.Options;

namespace Schulz.DoenerControl.Infrastructure.OrderDays;

// Resolves the business "today" (the local Bremen calendar day) and the absolute cutoff instant
// for a given day, from the injected TimeProvider so time-dependent behaviour stays deterministic
// in tests. Everything is computed in the configured business timezone, then anchored to a UTC
// DateTimeOffset for storage.
public sealed class OrderDayClock
{
    private readonly TimeProvider timeProvider;
    private readonly OrderDayOptions options;
    private readonly TimeZoneInfo timeZone;

    public OrderDayClock(TimeProvider timeProvider, IOptions<OrderDayOptions> options)
    {
        this.timeProvider = timeProvider;
        this.options = options.Value;
        timeZone = ResolveTimeZone(this.options.TimeZoneId);
    }

    public DateOnly Today()
    {
        var localNow = LocalNow();
        return DateOnly.FromDateTime(localNow.DateTime);
    }

    public DateTimeOffset CutoffFor(DateOnly day)
    {
        var localCutoff = day.ToDateTime(options.CutoffLocalTime, DateTimeKind.Unspecified);
        var offset = timeZone.GetUtcOffset(localCutoff);
        return new DateTimeOffset(localCutoff, offset).ToUniversalTime();
    }

    public DateTimeOffset UtcNow() => timeProvider.GetUtcNow();

    public string CutoffLabel() => $"{options.CutoffLocalTime:HH\\:mm} Uhr";

    private DateTimeOffset LocalNow() =>
        TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), timeZone);

    private static TimeZoneInfo ResolveTimeZone(string timeZoneId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
