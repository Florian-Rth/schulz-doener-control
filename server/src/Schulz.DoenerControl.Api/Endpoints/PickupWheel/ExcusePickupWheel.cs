using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Application.PickupWheel;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.PickupWheel;

public sealed class ExcusePickupWheelRequest
{
    [RouteParam]
    public Guid DayId { get; set; }
}

public sealed record ExcusePickupWheelResponse(OrderDayDetailsDto Day);

public sealed class ExcusePickupWheelRequestValidator : Validator<ExcusePickupWheelRequest>
{
    public ExcusePickupWheelRequestValidator()
    {
        RuleFor(request => request.DayId).NotEmpty();
    }
}

// "Ich habe einen SEHR wichtigen Grund" — the person the Glücksrad chose drops off the wheel and it
// spins again among the others. Only the currently chosen person may do this. Authenticated.
public sealed class ExcusePickupWheel
    : Endpoint<ExcusePickupWheelRequest, ExcusePickupWheelResponse>
{
    private readonly IPickupWheelService pickupWheelService;
    private readonly ICurrentUser currentUser;

    public ExcusePickupWheel(IPickupWheelService pickupWheelService, ICurrentUser currentUser)
    {
        this.pickupWheelService = pickupWheelService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/order-days/{DayId}/pickup-wheel/excuse");
    }

    public override async Task HandleAsync(ExcusePickupWheelRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new ExcusePickupWheelCommand(callerId, req.DayId);
        var result = await pickupWheelService.ExcuseAsync(command, ct);
        if (!result.IsSuccess)
        {
            await SendFailureAsync(result, ct);
            return;
        }

        await Send.OkAsync(
            new ExcusePickupWheelResponse(OrderDayDetailsMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync<T>(Result<T> result, CancellationToken ct)
    {
        switch (result.Status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Forbidden:
                await Send.ForbiddenAsync(ct);
                break;
            case ResultStatus.Conflict:
                AddError(result.Error ?? string.Empty);
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
