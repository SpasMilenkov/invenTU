using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Authorization.Policy;

namespace InvenTU.Api.Middleware;

/// <summary>
/// Custom authorization middleware result handler that provides more informative responses for forbidden access due to role requirements.
/// </summary>
public sealed class AuthorizationMessageResponseHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    /// <summary>
    /// Handles the result of an authorization policy evaluation. If access is forbidden due to role requirements, returns a 403 response with a message indicating the required roles. Otherwise, delegates to the default handler.
    /// </summary>
    /// <param name="next"></param>
    /// <param name="context"></param>
    /// <param name="policy"></param>
    /// <param name="authorizeResult"></param>
    /// <returns></returns>
    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult authorizeResult)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(policy);
        ArgumentNullException.ThrowIfNull(authorizeResult);

        // Add custom response message only to unauthorized access requests
        if (authorizeResult.Forbidden)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "text";

            var failedRoleRequirements = authorizeResult.AuthorizationFailure?.FailedRequirements?.OfType<RolesAuthorizationRequirement>();
            if (failedRoleRequirements == null) return;

            var responseMessage = new StringBuilder("User must be ");

            // Add required roles to custom message
            var separator = "";
            foreach (var req in failedRoleRequirements)
            {
                responseMessage.Append(separator).AppendJoin(" or ", req.AllowedRoles.Select(req => req.ToString()));
                separator = " and ";
            }

            await context.Response.WriteAsync(responseMessage.ToString().TrimEnd(',', ' '));

        }
        else
            await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
