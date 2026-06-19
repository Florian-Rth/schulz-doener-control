using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class PutMyOrderLineDto
{
    public string ProductId { get; set; } = string.Empty;

    public string? Meat { get; set; }

    public string? PizzaVariant { get; set; }

    public IReadOnlyList<string> Sauces { get; set; } = Array.Empty<string>();

    public int PriceCents { get; set; }

    public string? Extra { get; set; }

    public int Quantity { get; set; }
}

public sealed class PutMyOrderRequest
{
    [RouteParam]
    public Guid DayId { get; set; }

    public IReadOnlyList<PutMyOrderLineDto> Lines { get; set; } = Array.Empty<PutMyOrderLineDto>();

    public bool IsPickup { get; set; }
}

public sealed class PutMyOrderLineValidator : Validator<PutMyOrderLineDto>
{
    private static readonly string[] MeatNames =
    [
        nameof(MeatType.Kalb),
        nameof(MeatType.Haehnchen),
    ];
    private static readonly string[] SauceNames =
    [
        nameof(Sauce.Kraeuter),
        nameof(Sauce.Knoblauch),
        nameof(Sauce.Scharf),
    ];
    private static readonly string[] PizzaNames =
    [
        nameof(Core.Enums.PizzaVariant.Salami),
        nameof(Core.Enums.PizzaVariant.Margherita),
        nameof(Core.Enums.PizzaVariant.Funghi),
        nameof(Core.Enums.PizzaVariant.Tonno),
        nameof(Core.Enums.PizzaVariant.Hawaii),
    ];

    public PutMyOrderLineValidator()
    {
        RuleFor(line => line.ProductId).NotEmpty().MaximumLength(32);
        RuleFor(line => line.PriceCents).InclusiveBetween(1, 100000);
        RuleFor(line => line.Quantity).InclusiveBetween(1, 20);
        RuleFor(line => line.Extra).MaximumLength(300);

        RuleFor(line => line.Meat)
            .Must(meat => meat is null || MeatNames.Contains(meat))
            .WithMessage("Unbekannte Fleischsorte.");

        RuleFor(line => line.PizzaVariant)
            .Must(variant => variant is null || PizzaNames.Contains(variant))
            .WithMessage("Unbekannte Pizza-Sorte.");

        RuleFor(line => line.Sauces)
            .Must(sauces => sauces is null || sauces.All(SauceNames.Contains))
            .WithMessage("Unbekannte Soße.");

        RuleFor(line => line.Sauces)
            .Must(sauces => sauces is null || sauces.Distinct().Count() == sauces.Count)
            .WithMessage("Soßen dürfen nicht doppelt vorkommen.");

        // Shape cross-checks per line (the service is authoritative on kind): a pizza line carries a
        // variant and no meat/sauces; a döner line carries a meat and no variant.
        When(
            line => line.PizzaVariant is not null,
            () =>
            {
                RuleFor(line => line.Meat).Null().WithMessage("Pizza hat keine Fleischsorte.");
                RuleFor(line => line.Sauces)
                    .Must(sauces => sauces is null || sauces.Count == 0)
                    .WithMessage("Pizza hat keine Soßen.");
            }
        );

        When(
            line => line.PizzaVariant is null,
            () => RuleFor(line => line.Meat).NotNull().WithMessage("Fleischsorte erforderlich.")
        );
    }
}

public sealed class PutMyOrderRequestValidator : Validator<PutMyOrderRequest>
{
    public PutMyOrderRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
        RuleFor(request => request.Lines).NotNull().Must(lines => lines.Count is >= 1 and <= 20);
        RuleForEach(request => request.Lines).SetValidator(new PutMyOrderLineValidator());
    }
}

// Idempotent upsert of the caller's order for a day (add OR edit, one row per user per day, several
// lines), only while the day is open and before cutoff. Returns the bare OrderDetailsDto (PLAN #12 —
// no wrapper) so the FE can OrderDetailsSchema.parse the body directly. Authenticated.
public sealed class PutMyOrder : Endpoint<PutMyOrderRequest, OrderDetailsDto>
{
    private readonly IOrderService orderService;
    private readonly ICurrentUser currentUser;

    public PutMyOrder(IOrderService orderService, ICurrentUser currentUser)
    {
        this.orderService = orderService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Put("/api/order-days/{DayId}/orders/mine");
    }

    public override async Task HandleAsync(PutMyOrderRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new UpsertOrderCommand(
            callerId,
            req.DayId,
            req.Lines.Select(ToLineCommand).ToList(),
            req.IsPickup
        );

        var result = await orderService.UpsertMineAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(OrderDetailsMapper.ToDto(result.Value), cancellation: ct);
    }

    private static UpsertOrderLineCommand ToLineCommand(PutMyOrderLineDto line) =>
        new(
            line.ProductId,
            OrderVocabularyParser.ParseMeat(line.Meat),
            OrderVocabularyParser.ParsePizza(line.PizzaVariant),
            OrderVocabularyParser.ParseSauces(line.Sauces),
            line.PriceCents,
            line.Extra,
            line.Quantity
        );

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
