namespace ChattingApplicationProject.Interfaces
{
    public interface IUserCleanupService
    {
        Task<int> CleanupExpiredUnconfirmedUsersAsync();
        Task<int> CleanupExpiredPasswordResetTokensAsync();
    }
}
