using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Orders;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

public sealed class PutMyOrderLineDto
{
    public string ProductId { get; set; } = string.Empty;

    public IReadOnlyDictionary<string, AnswerFieldDto> Answers { get; set; } =
        new Dictionary<string, AnswerFieldDto>();

    // Optional per-unit price override; null means "use the server-suggested price".
    public int? PriceCents { get; set; }

    public int Quantity { get; set; }
}

public sealed class PutMyOrderRequest
{
    [RouteParam]
    public Guid DayId { get; set; }

    public IReadOnlyList<PutMyOrderLineDto> Lines { get; set; } = Array.Empty<PutMyOrderLineDto>();

    public bool IsPickup { get; set; }
}

// Shape-level validation only: the answers are semantically validated against the product's category
// in the order service (AnswerValidator), which is authoritative and DB-aware.
public sealed class PutMyOrderLineValidator : Validator<PutMyOrderLineDto>
{
    public PutMyOrderLineValidator()
    {
        RuleFor(line => line.ProductId).NotEmpty().MaximumLength(32);
        RuleFor(line => line.Quantity).InclusiveBetween(1, 20);
        RuleFor(line => line.PriceCents!.Value)
            .InclusiveBetween(1, 100000)
            .When(line => line.PriceCents is not null);
        RuleFor(line => line.Answers).NotNull().Must(answers => answers.Count <= 32);
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
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(OrderDetailsMapper.ToDto(result.Value), cancellation: ct);
    }

    private static UpsertOrderLineCommand ToLineCommand(PutMyOrderLineDto line) =>
        new(line.ProductId, AnswersWire.FromDto(line.Answers), line.PriceCents, line.Quantity);

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
            case ResultStatus.Validation:
                await Send.ErrorsAsync(cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
