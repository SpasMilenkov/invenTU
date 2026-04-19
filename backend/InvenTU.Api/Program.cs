using Microsoft.OpenApi;
using Serilog;
using InvenTU.Api.Middleware;
using InvenTU.Infrastructure;
using InvenTU.Application;
using InvenTU.Infrastructure.DataSeeders;
using Microsoft.AspNetCore.Authorization;
using InvenTU.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer(async (document, context, cancellationToken) =>
    {
        document.Info = new()
        {
            Title = "InvenTU API",
            Version = "v1",
            Description = "Inventory Management API"
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        // Add JWT bearer security scheme
        document.Components.SecuritySchemes.Add("bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme."
        });

        // Apply security scheme globally
        document.Security = [
            new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("bearer", document)] = []
            }
        ];

        // Set host document with security scheme for all elements
        document.SetReferenceHostDocument();
    });
});

builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, AuthorizationMessageResponseHandler>();

builder.Services.AddInvenTUInfrastructure(builder.Configuration);
builder.Services.AddInvenTUApplication();

builder.Services.AddTransient<ExceptionHandlingMiddleware>();

var allowedOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "InvenTU API v1");
    });
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";

    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("Host", httpContext.Request.Host.Value);
        diagnosticContext.Set("Protocol", httpContext.Request.Protocol);
    };
});

using (var scope = app.Services.CreateScope())
  {
      var db = scope.ServiceProvider.GetRequiredService<InvenTUDbContext>();
      await db.Database.MigrateAsync();
      await IdentityRoleSeeder.SeedRolesAsync(scope.ServiceProvider);
  }

app.UseCors("Frontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    Log.Information("Starting web host");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
