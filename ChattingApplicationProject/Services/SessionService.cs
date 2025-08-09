using ChattingApplicationProject.Data;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChattingApplicationProject.Services
{
    public class SessionService : ISessionService
    {
        private readonly DataContext _context;
        private readonly ILogger<SessionService> _logger;
        private const int SESSION_ABSOLUTE_TIMEOUT_DAYS = 7; // 7 days absolute timeout

        public SessionService(DataContext context, ILogger<SessionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<UserSession> CreateSessionAsync(
            int userId,
            string sessionToken,
            string refreshToken,
            string deviceInfo,
            string ipAddress
        )
        {
            _logger.LogInformation($"Creating session for user {userId}");

            var session = new UserSession
            {
                UserId = userId,
                SessionToken = sessionToken,
                RefreshToken = refreshToken,
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(SESSION_ABSOLUTE_TIMEOUT_DAYS),
                IsActive = true
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Session created for user {userId} with token {sessionToken}");
            return session;
        }

        public async Task<UserSession?> GetSessionByRefreshToken(string refreshToken)
        {
            var session = await _context.UserSessions.FirstOrDefaultAsync(s =>
                s.RefreshToken == refreshToken && s.IsActive == true
            );

            if (session != null)
            {
                _logger.LogInformation($"Found session by refresh token for user {session.UserId}");
            }
            else
            {
                _logger.LogInformation($"No active session found for refresh token");
            }

            return session;
        }

        public async Task InvalidateUserSessionsAsync(int userId)
        {
            // Invalidate ALL sessions for this user to fully logout
            var sessions = await _context.UserSessions.Where(s => s.UserId == userId).ToListAsync();

            _logger.LogInformation($"Invalidating {sessions.Count} sessions for user {userId}");

            foreach (var session in sessions)
            {
                session.IsActive = false;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation(
                $"Successfully invalidated {sessions.Count} sessions for user {userId}"
            );
        }

        public async Task InvalidateSessionAsync(string sessionToken)
        {
            var session = await _context.UserSessions.FirstOrDefaultAsync(s =>
                s.SessionToken == sessionToken && s.IsActive
            );

            if (session != null)
            {
                session.IsActive = false;
                await _context.SaveChangesAsync();
                _logger.LogInformation(
                    $"Invalidated session {sessionToken} for user {session.UserId}"
                );
            }
            else
            {
                _logger.LogWarning($"Session {sessionToken} not found or already inactive");
            }
        }

        public async Task UpdateSessionActivityAsync(string sessionToken)
        {
            var session = await _context.UserSessions.FirstOrDefaultAsync(s =>
                s.SessionToken == sessionToken && s.IsActive == true
            );

            if (session != null)
            {
                session.LastActivity = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation(
                    $"Updated activity for session {sessionToken} for user {session.UserId}"
                );
            }
            else
            {
                _logger.LogInformation(
                    $"Session {sessionToken} not found or inactive, skipping activity update"
                );
            }
        }

        public async Task CleanupExpiredSessionsAsync()
        {
            // Remove sessions that are expired
            var currentTime = DateTime.UtcNow;

            var expiredSessions = await _context
                .UserSessions.Where(s => s.ExpiresAt <= currentTime || s.IsActive == false)
                .ToListAsync();

            if (expiredSessions.Count > 0)
            {
                _context.UserSessions.RemoveRange(expiredSessions);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation($"Cleaned up {expiredSessions.Count} expired sessions");
        }

        public async Task<bool> ValidateSessionAsync(string sessionToken)
        {
            var currentTime = DateTime.UtcNow;

            _logger.LogInformation($"Validating session token: {sessionToken} at {currentTime}");

            var session = await _context.UserSessions.FirstOrDefaultAsync(s =>
                s.SessionToken == sessionToken && s.IsActive == true && s.ExpiresAt > currentTime
            );

            if (session != null)
            {
                // Update last activity
                session.LastActivity = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation(
                    $"Session {sessionToken} validated and activity updated for user {session.UserId}"
                );
                return true;
            }

            _logger.LogInformation(
                $"Session {sessionToken} validation failed - session not found or inactive/expired"
            );
            return false;
        }

        public async Task UpdateSessionTokensAsync(UserSession session)
        {
            _logger.LogInformation($"Updating session tokens for user {session.UserId}");
            await _context.SaveChangesAsync();
            _logger.LogInformation(
                $"Successfully updated session tokens for user {session.UserId}"
            );
        }
    }
}
