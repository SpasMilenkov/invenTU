namespace InvenTU.Api.Infrastructure;

/// <summary>
/// Helper class for managing authentication tokens in cookies.
/// </summary>
public static class CookieHelpers
{
    private const string ACCESS_TOKEN_NAME = "AccessToken";
    private const string REFRESH_TOKEN_NAME = "RefreshToken";

    private static readonly CookieOptions BaseCookieOptions = new()
    {
        HttpOnly = true,
        Secure = true,
        IsEssential = true,
        SameSite = SameSiteMode.None
    };

    /// <summary>
    ///  Sets both access and refresh tokens in the response cookies with appropriate options.
    /// </summary>
    /// <param name="response"></param>
    /// <param name="accessToken"></param>
    /// <param name="refreshToken"></param>
    public static void SetAuthTokens(HttpResponse response, string accessToken, string refreshToken)
    {
        SetAccessToken(response, accessToken);
        SetRefreshToken(response, refreshToken);
    }

    /// <summary>
    /// Sets the access token in the response cookies with appropriate options.
    /// </summary>
    /// <param name="response"></param>
    /// <param name="accessToken"></param>
    public static void SetAccessToken(HttpResponse response, string accessToken)
    {
        ArgumentNullException.ThrowIfNull(response, nameof(response));

        var cookieOptions = CreateCookieOptions(TimeSpan.FromMinutes(15));
        response.Cookies.Append(ACCESS_TOKEN_NAME, accessToken, cookieOptions);
    }

    /// <summary>
    /// Sets the refresh token in the response cookies with appropriate options.
    /// </summary>
    /// <param name="response"></param>
    /// <param name="refreshToken"></param>
    public static void SetRefreshToken(HttpResponse response, string refreshToken)
    {
        ArgumentNullException.ThrowIfNull(response, nameof(response));

        var cookieOptions = CreateCookieOptions(TimeSpan.FromDays(7));
        response.Cookies.Append(REFRESH_TOKEN_NAME, refreshToken, cookieOptions);
    }

    /// <summary>
    /// Retrieves the access token from the request cookies.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    public static string? GetAccessToken(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request, nameof(request));

        return request.Cookies[ACCESS_TOKEN_NAME];
    }

    /// <summary>
    /// Retrieves the refresh token from the request cookies.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    public static string? GetRefreshToken(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request, nameof(request));

        return request.Cookies[REFRESH_TOKEN_NAME];
    }

    /// <summary>
    /// Clears both access and refresh tokens from the response cookies by deleting them.
    /// </summary>
    /// <param name="response"></param>
    public static void ClearAuthTokens(HttpResponse response)
    {
        ArgumentNullException.ThrowIfNull(response, nameof(response));

        response.Cookies.Delete(ACCESS_TOKEN_NAME);
        response.Cookies.Delete(REFRESH_TOKEN_NAME);
    }

    private static CookieOptions CreateCookieOptions(TimeSpan expiration)
    {
        return new CookieOptions
        {
            HttpOnly = BaseCookieOptions.HttpOnly,
            Secure = BaseCookieOptions.Secure,
            IsEssential = BaseCookieOptions.IsEssential,
            SameSite = BaseCookieOptions.SameSite,
            Expires = DateTime.UtcNow.Add(expiration)
        };
    }
}
