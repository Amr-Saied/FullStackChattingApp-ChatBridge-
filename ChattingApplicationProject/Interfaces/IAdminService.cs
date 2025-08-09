using ChattingApplicationProject.DTO;

namespace ChattingApplicationProject.Interfaces
{
    public interface IAdminService
    {
        Task<PagedResult<AdminUserResponseDTO>> GetAllUsersForAdminAsync(
            PaginationParams paginationParams
        );
        Task<IEnumerable<AdminUserResponseDTO>> SearchUsersForAdminAsync(string searchTerm);
        Task<AdminUserResponseDTO?> GetUserForAdminAsync(int userId);
        Task<AdminUserResponseDTO?> EditUserAsync(int userId, AdminEditUserDTO editUserDto);
        Task<bool> BanUserAsync(int userId, AdminBanUserDTO banDto);
        Task<bool> UnbanUserAsync(int userId);
        Task<bool> DeleteUserAsync(int userId);
        Task<bool> IsUserBannedAsync(int userId);
        void CheckAndUnbanExpiredUsers();
    }
}
