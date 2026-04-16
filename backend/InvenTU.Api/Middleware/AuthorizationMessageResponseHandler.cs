using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;

namespace InvenTU.Api.Middleware;

public sealed class AuthorizationMessageResponseHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult authorizeResult)
    {
        // Add custom response message only to unauthorized access requests
        if (authorizeResult.Forbidden)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "text";

            var failedRoleRequirements = authorizeResult.AuthorizationFailure?.FailedRequirements?.OfType<RolesAuthorizationRequirement>();
            if (failedRoleRequirements == null) return;

            var responseMessage = new StringBuilder("User must be ");
            // Add required roles to custom message
            string separator = "";
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
