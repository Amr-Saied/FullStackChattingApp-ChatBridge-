using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ChattingApplicationProject.Helpers
{
    public class LogUserActivityFilter : IAsyncActionFilter
    {
        private readonly IUserService _userService;

        public LogUserActivityFilter(IUserService userService)
        {
            _userService = userService;
        }

        public async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next
        )
        {
            // Execute the action first
            var resultContext = await next();

            // Only update LastActive if the action was successful
            if (resultContext.Exception == null && resultContext.Result is ObjectResult)
            {
                var user = context.HttpContext.User;

                if (user.Identity?.IsAuthenticated == true)
                {
                    var username = user.Identity.Name;
                    if (!string.IsNullOrEmpty(username))
                    {
                        try
                        {
                            // Get the user from database
                            var appUser = await _userService.GetUserByUsername(username);
                            if (appUser != null)
                            {
                                // Update LastActive
                                appUser.LastActive = DateTime.Now;
                                await _userService.UpdateUserLastActive(appUser);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log error silently for production
                        }
                    }
                }
            }
        }
    }
}
