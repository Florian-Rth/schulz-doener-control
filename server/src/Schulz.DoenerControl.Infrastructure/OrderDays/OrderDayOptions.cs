namespace Schulz.DoenerControl.Infrastructure.OrderDays;

// Configuration for the Döner-Tag business clock: the local Bestellschluss time-of-day (default
// 11:30) and the IANA timezone the business day is anchored to (Bremen → Europe/Berlin).
public sealed class OrderDayOptions
{
    public const string CutoffConfigKey = "Auth:OrderCutoffLocalTime";
    public const string TimeZoneConfigKey = "Auth:BusinessTimeZone";

    public const string DefaultCutoffLocalTime = "11:30";
    public const string DefaultTimeZoneId = "Europe/Berlin";

    public TimeOnly CutoffLocalTime { get; set; } = new(11, 30);

    public string TimeZoneId { get; set; } = DefaultTimeZoneId;
}
