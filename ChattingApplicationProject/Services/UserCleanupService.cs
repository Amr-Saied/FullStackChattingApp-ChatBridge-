using ChattingApplicationProject.Data;
using ChattingApplicationProject.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ChattingApplicationProject.Services
{
    public class UserCleanupService : BackgroundService, IUserCleanupService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<UserCleanupService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromMinutes(30); // Run every 30 minutes for more frequent session cleanup

        public UserCleanupService(
            IServiceProvider serviceProvider,
            ILogger<UserCleanupService> logger
        )
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Starting cleanup tasks...");

                    // Clean up expired unconfirmed users
                    var cleanedUsers = await CleanupExpiredUnconfirmedUsersAsync();
                    if (cleanedUsers > 0)
                    {
                        _logger.LogInformation(
                            $"Cleaned up {cleanedUsers} expired unconfirmed users"
                        );
                    }

                    // Clean up expired password reset tokens
                    var cleanedTokens = await CleanupExpiredPasswordResetTokensAsync();
                    if (cleanedTokens > 0)
                    {
                        _logger.LogInformation(
                            $"Cleaned up {cleanedTokens} expired password reset tokens"
                        );
                    }

                    _logger.LogInformation("Cleanup tasks completed successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during cleanup tasks");
                }

                // Wait for the next cleanup cycle
                await Task.Delay(_period, stoppingToken);
            }
        }

        public async Task<int> CleanupExpiredUnconfirmedUsersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<DataContext>();

            var cutoffDate = DateTime.UtcNow.AddDays(-7); // Delete users unconfirmed for 7+ days

            var expiredUsers = await context
                .Users.Where(u =>
                    !u.EmailConfirmed
                    && u.Created < cutoffDate
                    && u.EmailConfirmationTokenExpiry < DateTime.UtcNow
                )
                .ToListAsync();

            if (expiredUsers.Any())
            {
                context.Users.RemoveRange(expiredUsers);
                await context.SaveChangesAsync();
            }

            return expiredUsers.Count;
        }

        public async Task<int> CleanupExpiredPasswordResetTokensAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<DataContext>();

                var expiredTokens = await context
                    .Users.Where(u => u.PasswordResetTokenExpiry < DateTime.UtcNow)
                    .ToListAsync();

                foreach (var user in expiredTokens)
                {
                    user.PasswordResetToken = null;
                    user.PasswordResetTokenExpiry = null;
                }

                if (expiredTokens.Any())
                {
                    await context.SaveChangesAsync();
                }

                return expiredTokens.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset token cleanup");
                return 0;
            }
        }
    }
}
