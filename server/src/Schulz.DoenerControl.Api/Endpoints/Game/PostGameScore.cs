using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Game;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Game;

public sealed class PostGameScoreRequest
{
    public int Score { get; set; }

    public int Hits { get; set; }

    public int Misses { get; set; }
}

public sealed record PostGameScoreResponse(Guid Id, int Score, bool IsPersonalBest);

public sealed class PostGameScoreRequestValidator : Validator<PostGameScoreRequest>
{
    public PostGameScoreRequestValidator()
    {
        RuleFor(request => request.Hits).InclusiveBetween(0, GameScoreRules.MaxThrowsPerRound);
        RuleFor(request => request.Misses).InclusiveBetween(0, GameScoreRules.MaxThrowsPerRound);
        RuleFor(request => request.Hits + request.Misses)
            .LessThanOrEqualTo(GameScoreRules.MaxThrowsPerRound)
            .WithName("Throws");
        RuleFor(request => request.Score)
            .GreaterThanOrEqualTo(0)
            .Must((request, score) => score <= GameScoreRules.MaxScoreFor(request.Hits))
            .WithMessage("Score is higher than the hits allow.");
    }
}

// Stores one finished Döner-Weitwurf round of the caller. The score is client-reported, so it is
// range-checked against what a 30 s round can produce. Authenticated.
public sealed class PostGameScore : Endpoint<PostGameScoreRequest, PostGameScoreResponse>
{
    private readonly IGameScoreService gameScoreService;
    private readonly ICurrentUser currentUser;

    public PostGameScore(IGameScoreService gameScoreService, ICurrentUser currentUser)
    {
        this.gameScoreService = gameScoreService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/game/scores");
    }

    public override async Task HandleAsync(PostGameScoreRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new SubmitGameScoreCommand(callerId, req.Score, req.Hits, req.Misses);
        var result = await gameScoreService.SubmitAsync(command, ct);
        if (!result.IsSuccess)
        {
            AddError(result.Error ?? "Invalid score.");
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static PostGameScoreResponse MapToResponse(GameScoreDetails details) =>
        new(details.Id, details.Score, details.IsPersonalBest);
}
