using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ChattingApplicationProject.Errors;
using ChattingApplicationProject.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ChattingApplicationProject.Middlwares
{
    public class ExceptionHandlingMiddlware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddlware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionHandlingMiddlware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddlware> logger,
            IHostEnvironment env
        )
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context, ISessionService sessionService)
        {
            // Best-effort: update session activity if authenticated
            try
            {
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    var token = authHeader.Substring("Bearer ".Length);
                    await sessionService.UpdateSessionActivityAsync(token);
                }
            }
            catch
            { /* ignore */
            }

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = 500;

                var response = _env.IsDevelopment()
                    ? new ApiException(
                        500,
                        ex.Message,
                        $"Stack Trace: {ex.StackTrace}\nSource: {ex.Source}\nTarget Site: {ex.TargetSite}"
                    )
                    : new ApiException(
                        500,
                        "Internal Server Error",
                        "An unexpected error occurred"
                    );

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };
                var json = JsonSerializer.Serialize(response, options);

                await context.Response.WriteAsync(json);
            }
        }
    }
}
