namespace Schulz.DoenerControl.Core.Entities;

public sealed class NotificationTemplate
{
    public Guid Id { get; set; }

    // The absurd Döner synonym this text is themed around (e.g. "Drehspieß-Tasche"). Copied onto
    // OrderDay.Synonym when this template is picked at open time.
    public required string Synonym { get; set; }

    // The German push/feed message sent when a Döner-Tag opens. Each template phrases it a little
    // differently; one active template is picked at random when the day opens.
    public required string Body { get; set; }

    // Only active templates are eligible for the random pick; an admin can disable one without
    // deleting it.
    public bool IsActive { get; set; } = true;
}
