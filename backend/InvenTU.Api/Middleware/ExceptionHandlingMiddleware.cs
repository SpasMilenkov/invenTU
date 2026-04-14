using System.Text.Json;
using InvenTU.Core.Exceptions;
using AppValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Api.Middleware;

//TODO: Rewrite with exception handler or inherit middleware interface
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppValidationException ex)
        {
            logger.LogWarning(ex, "Validation error: {ErrorCode}", ex.ErrorCode);
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.ErrorCode, ex.Message, ex.Errors);
        }
        catch (AppException ex)
        {
            logger.LogWarning(ex, "Application error: {ErrorCode}", ex.ErrorCode);
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.ErrorCode, ex.Message, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            var isDev = context.RequestServices
                .GetRequiredService<IWebHostEnvironment>()
                .IsDevelopment();
            var message = isDev ? ex.Message : "An unexpected error occurred.";
            await WriteErrorResponseAsync(context, 500, "INTERNAL_ERROR", message, null);
        }
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        int statusCode,
        string errorCode,
        string message,
        IReadOnlyDictionary<string, string[]>? errors)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        IDictionary<string, string[]> errorDict = errors is not null
            ? errors.ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
            : new Dictionary<string, string[]>();

        var body = new
        {
            error = errorCode,
            message,
            errors = errorDict,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
    }
}
