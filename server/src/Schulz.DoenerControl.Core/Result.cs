using System.Collections.ObjectModel;

namespace Schulz.DoenerControl.Core;

public enum ResultStatus
{
    Success,
    NotFound,
    Conflict,
    Validation,
}

public sealed record Result<T>
{
    private static readonly ReadOnlyCollection<string> NoErrors = new(Array.Empty<string>());

    private readonly T? value;

    private Result(ResultStatus status, T? value, ReadOnlyCollection<string> errors)
    {
        Status = status;
        this.value = value;
        Errors = errors;
    }

    public ResultStatus Status { get; }

    public bool IsSuccess => Status == ResultStatus.Success;

    public IReadOnlyList<string> Errors { get; }

    public string? Error => Errors.Count > 0 ? Errors[0] : null;

    public T Value =>
        IsSuccess
            ? value!
            : throw new InvalidOperationException(
                $"Cannot access the value of a result with status '{Status}'."
            );

    public static Result<T> Success(T value) => new(ResultStatus.Success, value, NoErrors);

    public static Result<T> NotFound(params string[] errors) =>
        new(ResultStatus.NotFound, default, ToReadOnly(errors));

    public static Result<T> Conflict(params string[] errors) =>
        new(ResultStatus.Conflict, default, ToReadOnly(errors));

    public static Result<T> Validation(params string[] errors) =>
        new(ResultStatus.Validation, default, ToReadOnly(errors));

    private static ReadOnlyCollection<string> ToReadOnly(string[] errors) =>
        errors.Length == 0 ? NoErrors : new ReadOnlyCollection<string>(errors);
}

public sealed record Result
{
    private static readonly ReadOnlyCollection<string> NoErrors = new(Array.Empty<string>());

    private Result(ResultStatus status, ReadOnlyCollection<string> errors)
    {
        Status = status;
        Errors = errors;
    }

    public ResultStatus Status { get; }

    public bool IsSuccess => Status == ResultStatus.Success;

    public IReadOnlyList<string> Errors { get; }

    public string? Error => Errors.Count > 0 ? Errors[0] : null;

    public static Result Success() => new(ResultStatus.Success, NoErrors);

    public static Result NotFound(params string[] errors) =>
        new(ResultStatus.NotFound, ToReadOnly(errors));

    public static Result Conflict(params string[] errors) =>
        new(ResultStatus.Conflict, ToReadOnly(errors));

    public static Result Validation(params string[] errors) =>
        new(ResultStatus.Validation, ToReadOnly(errors));

    private static ReadOnlyCollection<string> ToReadOnly(string[] errors) =>
        errors.Length == 0 ? NoErrors : new ReadOnlyCollection<string>(errors);
}
