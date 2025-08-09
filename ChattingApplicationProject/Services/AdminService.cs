using AutoMapper;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Hubs;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Services
{
    public class AdminService : IAdminService
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        private readonly IHubContext<MessageHub> _hubContext;

        public AdminService(DataContext context, IMapper mapper, IHubContext<MessageHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        public async Task<PagedResult<AdminUserResponseDTO>> GetAllUsersForAdminAsync(
            PaginationParams paginationParams
        )
        {
            // Check and unban expired users before returning the list
            CheckAndUnbanExpiredUsers();
            await _context.SaveChangesAsync();

            var query = _context.Users.Include(u => u.Photos);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalCount / paginationParams.PageSize);

            var users = await query
                .OrderByDescending(u => u.Created)
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToListAsync();

            var userDtos = _mapper.Map<List<AdminUserResponseDTO>>(users);

            // Set PhotoUrl for each user
            foreach (var userDto in userDtos)
            {
                var user = users.First(u => u.Id == userDto.Id);
                var mainPhoto = user.Photos?.FirstOrDefault(p => p.IsMain);
                userDto.PhotoUrl = mainPhoto?.Url;
                userDto.Age = user.GetAge();
            }

            return new PagedResult<AdminUserResponseDTO>
            {
                Items = userDtos,
                TotalCount = totalCount,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalPages = totalPages
            };
        }

        public async Task<IEnumerable<AdminUserResponseDTO>> SearchUsersForAdminAsync(
            string searchTerm
        )
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                var pagedResult = await GetAllUsersForAdminAsync(
                    new PaginationParams { PageNumber = 1, PageSize = 50 }
                );
                return pagedResult.Items ?? new List<AdminUserResponseDTO>();
            }

            var users = await _context
                .Users.Include(u => u.Photos)
                .Where(u =>
                    u.UserName.ToLower().Contains(searchTerm.ToLower())
                    || u.KnownAs.ToLower().Contains(searchTerm.ToLower())
                    || u.City.ToLower().Contains(searchTerm.ToLower())
                    || u.Country.ToLower().Contains(searchTerm.ToLower())
                )
                .OrderByDescending(u => u.Created)
                .ToListAsync();

            var userDtos = _mapper.Map<List<AdminUserResponseDTO>>(users);

            // Set PhotoUrl for each user
            foreach (var userDto in userDtos)
            {
                var user = users.First(u => u.Id == userDto.Id);
                var mainPhoto = user.Photos?.FirstOrDefault(p => p.IsMain);
                userDto.PhotoUrl = mainPhoto?.Url;
                userDto.Age = user.GetAge();
            }

            return userDtos;
        }

        public async Task<AdminUserResponseDTO?> GetUserForAdminAsync(int userId)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return null;

            var userDto = _mapper.Map<AdminUserResponseDTO>(user);
            var mainPhoto = user.Photos?.FirstOrDefault(p => p.IsMain);
            userDto.PhotoUrl = mainPhoto?.Url;
            userDto.Age = user.GetAge();

            return userDto;
        }

        public async Task<AdminUserResponseDTO?> EditUserAsync(
            int userId,
            AdminEditUserDTO editUserDto
        )
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return null;

            // Update user properties using AutoMapper
            _mapper.Map(editUserDto, user);

            try
            {
                await _context.SaveChangesAsync();

                var userDto = _mapper.Map<AdminUserResponseDTO>(user);
                var mainPhoto = user.Photos?.FirstOrDefault(p => p.IsMain);
                userDto.PhotoUrl = mainPhoto?.Url;
                userDto.Age = user.GetAge();

                return userDto;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> BanUserAsync(int userId, AdminBanUserDTO banDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.IsBanned = true;
            user.BanReason = banDto.BanReason;
            user.IsPermanentBan = banDto.IsPermanentBan;

            if (!banDto.IsPermanentBan && banDto.BanExpiryDate.HasValue)
            {
                user.BanExpiryDate = banDto.BanExpiryDate;
            }
            else if (banDto.IsPermanentBan)
            {
                user.BanExpiryDate = null; // Permanent ban has no expiry
            }

            try
            {
                await _context.SaveChangesAsync();

                // Build complete ban message (same format as HTTP response)
                var banMessage = "Your account has been banned.";
                if (!string.IsNullOrEmpty(user.BanReason))
                {
                    banMessage += $" Reason: {user.BanReason}";
                }
                if (!user.IsPermanentBan && user.BanExpiryDate.HasValue)
                {
                    banMessage +=
                        $" Your ban expires on: {user.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")}";
                }
                banMessage += " Please contact an administrator for more information.";

                // Send real-time ban notification to the user with complete message
                await _hubContext.Clients.All.SendAsync(
                    "UserBanned",
                    user.Id,
                    banMessage,
                    user.IsPermanentBan
                );
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UnbanUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.IsBanned = false;
            user.BanReason = null;
            user.BanExpiryDate = null;
            user.IsPermanentBan = false;

            try
            {
                await _context.SaveChangesAsync();
                // Send real-time unban notification to the user
                await _hubContext.Clients.All.SendAsync("UserUnbanned", userId);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .Include(u => u.MessagesSent)
                .Include(u => u.MessagesReceived)
                .Include(u => u.LikedByUsers)
                .Include(u => u.LikedUsers)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return false;

            try
            {
                // Remove related data first
                if (user.Photos != null)
                {
                    _context.Photos.RemoveRange(user.Photos);
                }

                if (user.MessagesSent != null)
                {
                    _context.Messages.RemoveRange(user.MessagesSent);
                }

                if (user.MessagesReceived != null)
                {
                    _context.Messages.RemoveRange(user.MessagesReceived);
                }

                if (user.LikedByUsers != null)
                {
                    _context.UserLikes.RemoveRange(user.LikedByUsers);
                }

                if (user.LikedUsers != null)
                {
                    _context.UserLikes.RemoveRange(user.LikedUsers);
                }

                // Remove the user
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IsUserBannedAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            // Check if user is banned and if temporary ban has expired
            if (user.IsBanned)
            {
                if (!user.IsPermanentBan && user.BanExpiryDate.HasValue)
                {
                    if (DateTime.Now >= user.BanExpiryDate.Value)
                    {
                        // Ban has expired, unban the user
                        await UnbanUserAsync(userId);
                        return false;
                    }
                }
                return true;
            }

            return false;
        }

        public void CheckAndUnbanExpiredUsers()
        {
            var expiredBannedUsers = _context
                .Users.Where(u =>
                    u.IsBanned
                    && !u.IsPermanentBan
                    && u.BanExpiryDate.HasValue
                    && DateTime.Now >= u.BanExpiryDate.Value
                )
                .ToList();

            foreach (var user in expiredBannedUsers)
            {
                user.IsBanned = false;
                user.BanReason = null;
                user.BanExpiryDate = null;
                user.IsPermanentBan = false;
            }
        }
    }
}
