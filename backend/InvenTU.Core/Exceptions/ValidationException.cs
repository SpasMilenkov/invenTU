namespace InvenTU.Core.Exceptions;

public sealed class ValidationException : AppException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base(422, "VALIDATION_ERROR", "One or more validation errors occurred.")
    {
        Errors = errors;
    }
}
