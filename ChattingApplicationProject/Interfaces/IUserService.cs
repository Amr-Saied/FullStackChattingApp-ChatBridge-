using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Models;

namespace ChattingApplicationProject.Interfaces
{
    public interface IUserService
    {
        Task<bool> UserExists(string username);
        Task<AppUser> AddUser(AppUser user);
        Task<IEnumerable<MemeberDTO>> GetUsersDTO();
        Task<MemeberDTO> GetUserByIdDTO(int id);
        Task<AppUser> GetUserById(int id);
        Task<AppUser> GetUserByUsername(string username);
        Task<MemeberDTO> GetUserByUsernameDTO(string username);
        Task<MemeberDTO> UpdateUserDTO(int id, MemeberDTO user);
        Task<bool> AddPhotoToGallery(int userId, PhotoDTO photo);
        Task<bool> DeletePhotoFromGallery(int userId, int photoId);
        Task<PagedResult<MemeberDTO>> GetUsersPagedAsync(PaginationParams paginationParams);
        Task<IEnumerable<MemeberDTO>> SearchUsersAsync(string searchTerm);
        Task<bool> UpdateUserLastActive(AppUser user);
        string GetLastActiveStatus(DateTime lastActive);
        Task<AppUser?> GetUserByGoogleId(string? googleId);
        Task<object> GetUnconfirmedUsersCountAsync();
        Task<bool> UpdateUser(AppUser user);
        Task<bool> UpdateUsername(string currentUsername, string newUsername);
    }
}
