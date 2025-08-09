using System.Collections.Generic;
using System.Threading.Tasks;
using ChattingApplicationProject.DTO;

namespace ChattingApplicationProject.Interfaces
{
    public interface ILikeService
    {
        // Like/Unlike operations
        Task<bool> AddLike(int sourceUserId, int likedUserId);
        Task<bool> RemoveLike(int sourceUserId, int likedUserId);
        Task<bool> HasUserLiked(int sourceUserId, int likedUserId);

        // Get like count for a user
        Task<int> GetUserLikedByCount(int userId);
        
        // Get users that the current user has liked
        Task<List<MemeberDTO>> GetUsersLikedByCurrentUser(int currentUserId);
        
        // Get paginated users that the current user has liked
        Task<PagedResult<MemeberDTO>> GetUsersLikedByCurrentUserPaged(int currentUserId, int pageNumber, int pageSize);
    }
}
