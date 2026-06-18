using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class PutMyOrderRequest
{
    [RouteParam]
    public Guid DayId { get; set; }

    public string ProductId { get; set; } = string.Empty;

    public string? Meat { get; set; }

    public string? PizzaVariant { get; set; }

    public IReadOnlyList<string> Sauces { get; set; } = Array.Empty<string>();

    public int PriceCents { get; set; }

    public string? Extra { get; set; }

    public bool IsPickup { get; set; }
}

public sealed record PutMyOrderResponse(OrderDetailsDto Order);

public sealed class PutMyOrderRequestValidator : Validator<PutMyOrderRequest>
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

    public PutMyOrderRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
        RuleFor(request => request.ProductId).NotEmpty().MaximumLength(32);
        RuleFor(request => request.PriceCents).InclusiveBetween(1, 100000);
        RuleFor(request => request.Extra).MaximumLength(300);

        RuleFor(request => request.Meat)
            .Must(meat => meat is null || MeatNames.Contains(meat))
            .WithMessage("Unbekannte Fleischsorte.");

        RuleFor(request => request.PizzaVariant)
            .Must(variant => variant is null || PizzaNames.Contains(variant))
            .WithMessage("Unbekannte Pizza-Sorte.");

        RuleFor(request => request.Sauces)
            .Must(sauces => sauces is null || sauces.All(SauceNames.Contains))
            .WithMessage("Unbekannte Soße.");

        RuleFor(request => request.Sauces)
            .Must(sauces => sauces is null || sauces.Distinct().Count() == sauces.Count)
            .WithMessage("Soßen dürfen nicht doppelt vorkommen.");

        // Shape cross-checks (the service is authoritative on kind): a pizza order carries a variant
        // and no meat/sauces; a döner order carries a meat and no variant.
        When(
            request => request.PizzaVariant is not null,
            () =>
            {
                RuleFor(request => request.Meat)
                    .Null()
                    .WithMessage("Pizza hat keine Fleischsorte.");
                RuleFor(request => request.Sauces)
                    .Must(sauces => sauces is null || sauces.Count == 0)
                    .WithMessage("Pizza hat keine Soßen.");
            }
        );

        When(
            request => request.PizzaVariant is null,
            () =>
                RuleFor(request => request.Meat).NotNull().WithMessage("Fleischsorte erforderlich.")
        );
    }
}

// Idempotent upsert of the caller's order for a day (add OR edit, one row per user per day), only
// while the day is open and before cutoff. Authenticated.
public sealed class PutMyOrder : Endpoint<PutMyOrderRequest, PutMyOrderResponse>
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
            req.ProductId,
            OrderVocabularyParser.ParseMeat(req.Meat),
            OrderVocabularyParser.ParsePizza(req.PizzaVariant),
            OrderVocabularyParser.ParseSauces(req.Sauces),
            req.PriceCents,
            req.Extra,
            req.IsPickup
        );

        var result = await orderService.UpsertMineAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new PutMyOrderResponse(OrderDetailsMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }

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
