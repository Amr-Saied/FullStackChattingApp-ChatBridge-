using ChattingApplicationProject.Models;

namespace ChattingApplicationProject.Interfaces
{
    public interface ISessionService
    {
        Task<UserSession> CreateSessionAsync(
            int userId,
            string sessionToken,
            string refreshToken,
            string deviceInfo,
            string ipAddress
        );
        Task<UserSession?> GetSessionByRefreshToken(string refreshToken);
        Task InvalidateUserSessionsAsync(int userId);
        Task InvalidateSessionAsync(string sessionToken);
        Task UpdateSessionActivityAsync(string sessionToken);
        Task CleanupExpiredSessionsAsync();
        Task<bool> ValidateSessionAsync(string sessionToken);
        Task UpdateSessionTokensAsync(UserSession session);
    }
}
