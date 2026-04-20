using System.Text.Json;
using InvenTU.Core.Exceptions;
using AppValidationException = InvenTU.Core.Exceptions.ValidationException;

namespace InvenTU.Api.Middleware;

/// <summary>
/// Middleware that intercepts unhandled exceptions and writes a structured JSON error
/// response, mapping <see cref="AppException"/> and <see cref="AppValidationException"/>
/// to their respective HTTP status codes and error codes. Unrecognised exceptions produce
/// a 500 response, with the raw message exposed only in the Development environment.
/// </summary>
public sealed partial class ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger) : IMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [LoggerMessage(Level = LogLevel.Warning, Message = "Validation error: {ErrorCode}")]
    private partial void LogValidationError(Exception ex, string errorCode);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Application error: {ErrorCode}")]
    private partial void LogApplicationError(Exception ex, string errorCode);

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception")]
    private partial void LogUnhandledException(Exception ex);

    /// <summary>
    /// Invokes the next middleware in the pipeline and handles any exceptions that propagate
    /// back through it. Known <see cref="AppException"/> subtypes are mapped to structured
    /// error responses; everything else is caught and returned as a 500.
    /// </summary>
    /// <param name="context">The current HTTP context.</param>
    /// <param name="next">The delegate for the next middleware in the pipeline.</param>
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (AppValidationException ex)
        {
            LogValidationError(ex, ex.ErrorCode);
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.ErrorCode, ex.Message, ex.Errors);
        }
        catch (InsufficientStockException ex)
        {
            LogApplicationError(ex, ex.ErrorCode);
            await WriteInsufficientStockResponseAsync(context, ex);
        }
        catch (AppException ex)
        {
            LogApplicationError(ex, ex.ErrorCode);
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.ErrorCode, ex.Message, null);
        }
        catch (Exception ex)
        {
            LogUnhandledException(ex);
            var isDev = context.RequestServices
                .GetRequiredService<IWebHostEnvironment>()
                .IsDevelopment();
            var message = isDev ? ex.Message : "An unexpected error occurred.";
            await WriteErrorResponseAsync(context, 500, "INTERNAL_ERROR", message, null);
        }
    }

    private static async Task WriteInsufficientStockResponseAsync(HttpContext context, InsufficientStockException ex)
    {
        context.Response.StatusCode = ex.StatusCode;
        context.Response.ContentType = "application/json";

        var body = new
        {
            error = ex.ErrorCode,
            message = ex.Message,
            productName = ex.ProductName,
            requestedQuantity = ex.RequestedQuantity,
            availableQuantity = ex.AvailableQuantity,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
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
            : [];

        var body = new
        {
            error = errorCode,
            message,
            errors = errorDict,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
    }
}
