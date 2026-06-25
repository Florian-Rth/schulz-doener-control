using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

public sealed class ForceEndDayRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed record ForceEndDayResponse(OrderDayDetailsDto Day, int RemovedOrders);

public sealed class ForceEndDayRequestValidator : Validator<ForceEndDayRequest>
{
    public ForceEndDayRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Scrap-and-end ("Döner-Tag beenden"): force-ends a running Döner-Tag in any open state — discards
// every order and closes it WITHOUT crystallizing debts. Allowed for an admin OR the day's
// designated collector (Abholer); the collector's normal debt-generating close is the separate
// /close endpoint. Authorization is enforced in the service. Returns how many orders were discarded.
public sealed class ForceEndDay : Endpoint<ForceEndDayRequest, ForceEndDayResponse>
{
    private readonly IOrderDayService orderDayService;
    private readonly ICurrentUser currentUser;

    public ForceEndDay(IOrderDayService orderDayService, ICurrentUser currentUser)
    {
        this.orderDayService = orderDayService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        // Authenticated, but NOT admin-gated: the service authorizes (admin OR the day's collector).
        Post("/api/order-days/{Id}/force-end");
    }

    public override async Task HandleAsync(ForceEndDayRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await orderDayService.ForceEndAsync(
            callerId,
            User.IsInRole("Admin"),
            req.Id,
            ct
        );

        if (!result.IsSuccess)
        {
            await SendFailureAsync(result.Status, ct);
            return;
        }

        var value = result.Value;
        var response = new ForceEndDayResponse(
            OrderDayDetailsMapper.ToDto(value.Day),
            value.RemovedOrders
        );
        await Send.OkAsync(response, cancellation: ct);
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Forbidden:
                await Send.ForbiddenAsync(ct);
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
