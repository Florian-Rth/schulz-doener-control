using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Schulz.DoenerControl.Application.Email;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Email;

// Orchestrates "mail the day's order list as a PDF to my work email". Guards in order: SMTP enabled,
// day exists + open, caller is Abholer or admin, caller has a work email. Then renders the PDF and
// hands it to the email service; returns the address it was sent to.
public sealed class OrderListMailService : IOrderListMailService
{
    private const string MailNotConfigured = "Mailversand ist nicht eingerichtet, Chef.";
    private const string DayNotFound = "Döner-Tag nicht gefunden.";
    private const string DayNotOpen = "Der Döner-Tag ist nicht mehr offen, Chef.";
    private const string NotCollector = "Nur der Abholer darf die Liste verschicken, Chef.";
    private const string NoWorkEmail = "Hinterlege zuerst deine Arbeits-Mail im Profil, Chef.";
    private const string MailSendFailed = "Mailversand fehlgeschlagen, Chef.";

    private readonly IEmailService emailService;
    private readonly IOrderDayService orderDayService;
    private readonly OrderListPdfRenderer pdfRenderer;
    private readonly AppDbContext database;
    private readonly ILogger<OrderListMailService> logger;

    public OrderListMailService(
        IEmailService emailService,
        IOrderDayService orderDayService,
        OrderListPdfRenderer pdfRenderer,
        AppDbContext database,
        ILogger<OrderListMailService> logger
    )
    {
        this.emailService = emailService;
        this.orderDayService = orderDayService;
        this.pdfRenderer = pdfRenderer;
        this.database = database;
        this.logger = logger;
    }

    public async Task<Result<string>> SendDayListToCallerAsync(
        Guid callerId,
        bool callerIsAdmin,
        Guid orderDayId,
        CancellationToken ct
    )
    {
        if (!emailService.IsEnabled)
            return Result<string>.Conflict(MailNotConfigured);

        var dayResult = await orderDayService.GetByIdAsync(
            new GetOrderDayQuery(callerId, orderDayId),
            ct
        );
        if (!dayResult.IsSuccess)
            return Result<string>.NotFound(DayNotFound);

        var day = dayResult.Value;
        if (day.Status != nameof(OrderDayStatus.Open))
            return Result<string>.Conflict(DayNotOpen);

        if (!(callerIsAdmin || day.AmICollector))
            return Result<string>.Forbidden(NotCollector);

        var workEmail = await database
            .Users.AsNoTracking()
            .Where(user => user.Id == callerId)
            .Select(user => user.WorkEmail)
            .FirstOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(workEmail))
            return Result<string>.Validation(NoWorkEmail);

        var pdf = pdfRenderer.Render(day);
        var message = new EmailMessage(
            workEmail,
            $"Döner-Tag {day.Date:dd.MM.yyyy} — Bestellliste",
            "Hier ist die Bestellliste, Chef. Im Anhang als PDF.",
            new EmailAttachment("doener-liste.pdf", "application/pdf", pdf)
        );
        try
        {
            await emailService.SendAsync(message, ct);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            // An enabled-but-misconfigured SMTP host (bad host, auth/TLS failure, …) must surface as
            // a clean German error, not an unhandled 500. Log the real reason so an operator can
            // diagnose it (e.g. an SMTP "Access Restricted" auth rejection from the provider).
            // Cancellation still propagates.
            logger.LogError(ex, "Order-list PDF mail to {Address} failed", message.ToAddress);
            return Result<string>.Conflict(MailSendFailed);
        }

        return Result<string>.Success(workEmail);
    }
}
