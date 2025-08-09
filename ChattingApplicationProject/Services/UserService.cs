using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Services
{
    public class UserService : IUserService
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;

        public UserService(DataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<bool> UserExists(string username)
        {
            return await _context.Users.AnyAsync(x => x.UserName == username.ToLower());
        }

        public async Task<AppUser> AddUser(AppUser user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        // New DTO methods
        public async Task<IEnumerable<MemeberDTO>> GetUsersDTO()
        {
            var users = await _context.Users.Include(u => u.Photos).ToListAsync();
            return _mapper.Map<IEnumerable<MemeberDTO>>(users);
        }

        public async Task<MemeberDTO> GetUserByIdDTO(int id)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(x => x.Id == id);
            return _mapper.Map<MemeberDTO>(user);
        }

        public async Task<AppUser> GetUserById(int id)
        {
            return await _context.Users.Include(u => u.Photos).FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<AppUser> GetUserByUsername(string username)
        {
            return await _context
                .Users.Include(u => u.Photos)
                .SingleOrDefaultAsync(x => x.UserName == username.ToLower());
        }

        public async Task<MemeberDTO> GetUserByUsernameDTO(string username)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .SingleOrDefaultAsync(x => x.UserName == username.ToLower());
            return _mapper.Map<MemeberDTO>(user);
        }

        public async Task<MemeberDTO> UpdateUserDTO(int id, MemeberDTO user)
        {
            var userToUpdate = await _context.Users.FindAsync(id);
            _mapper.Map(user, userToUpdate);
            // If PhotoUrl is set, update the main photo in Photos
            if (!string.IsNullOrEmpty(user.PhotoUrl) && userToUpdate.Photos != null)
            {
                var mainPhoto = userToUpdate.Photos.FirstOrDefault(p => p.IsMain);
                if (mainPhoto != null)
                {
                    mainPhoto.Url = user.PhotoUrl;
                }
                else if (userToUpdate.Photos.Count > 0)
                {
                    // If no main photo, set the first as main and update its URL
                    var firstPhoto = userToUpdate.Photos.First();
                    firstPhoto.Url = user.PhotoUrl;
                    firstPhoto.IsMain = true;
                }
                else
                {
                    // If no photos, add a new main photo
                    userToUpdate.Photos = new List<Photo>
                    {
                        new Photo { Url = user.PhotoUrl, IsMain = true }
                    };
                }
            }
            await _context.SaveChangesAsync();
            return _mapper.Map<MemeberDTO>(userToUpdate);
        }

        public async Task<bool> AddPhotoToGallery(int userId, PhotoDTO photo)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return false;
            var newPhoto = new Photo { Url = photo.Url, IsMain = false };
            user.Photos ??= new List<Photo>();
            user.Photos.Add(newPhoto);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePhotoFromGallery(int userId, int photoId)
        {
            var user = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Photos == null)
                return false;
            var photo = user.Photos.FirstOrDefault(p => p.Id == photoId);
            if (photo == null)
                return false;
            _context.Photos.Remove(photo);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<MemeberDTO>> GetUsersPagedAsync(
            PaginationParams paginationParams
        )
        {
            var query = _context.Users.Include(u => u.Photos).AsQueryable();
            query = query.Where(u => u.Role != "Admin"); // Filter out Admin users
            query = query.OrderByDescending(u => u.Created);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)paginationParams.PageSize);

            var users = await query
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToListAsync();

            var userDtos = _mapper.Map<List<MemeberDTO>>(users);

            return new PagedResult<MemeberDTO>
            {
                Items = userDtos,
                TotalCount = totalCount,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalPages = totalPages
            };
        }

        public async Task<IEnumerable<MemeberDTO>> SearchUsersAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetUsersDTO();

            var users = await _context
                .Users.Include(u => u.Photos)
                .Where(u =>
                    u.UserName.ToLower().Contains(searchTerm.ToLower())
                    || u.KnownAs.ToLower().Contains(searchTerm.ToLower())
                    || u.City.ToLower().Contains(searchTerm.ToLower())
                )
                .Where(u => u.Role != "Admin") // Filter out Admin users
                .OrderByDescending(u => u.Created)
                .ToListAsync();

            return _mapper.Map<IEnumerable<MemeberDTO>>(users);
        }

        public async Task<bool> UpdateUserLastActive(AppUser user)
        {
            try
            {
                var userToUpdate = await _context.Users.FindAsync(user.Id);
                if (userToUpdate != null)
                {
                    userToUpdate.LastActive = user.LastActive;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public string GetLastActiveStatus(DateTime lastActive)
        {
            var timeSpan = DateTime.Now - lastActive;

            if (timeSpan.TotalMinutes < 60)
            {
                var minutes = (int)timeSpan.TotalMinutes;
                return minutes <= 1 ? "1 minute ago" : $"{minutes} minutes ago";
            }
            else if (timeSpan.TotalHours < 24)
            {
                var hours = (int)timeSpan.TotalHours;
                return hours == 1 ? "1 hour ago" : $"{hours} hours ago";
            }
            else if (timeSpan.TotalDays < 7)
            {
                var days = (int)timeSpan.TotalDays;
                return days == 1 ? "1 day ago" : $"{days} days ago";
            }
            else if (timeSpan.TotalDays < 30)
            {
                var weeks = (int)(timeSpan.TotalDays / 7);
                return weeks == 1 ? "1 week ago" : $"{weeks} weeks ago";
            }
            else if (timeSpan.TotalDays < 365)
            {
                var months = (int)(timeSpan.TotalDays / 30);
                return months == 1 ? "1 month ago" : $"{months} months ago";
            }
            else
            {
                var years = (int)(timeSpan.TotalDays / 365);
                return years == 1 ? "1 year ago" : $"{years} years ago";
            }
        }

        public async Task<AppUser?> GetUserByGoogleId(string? googleId)
        {
            if (string.IsNullOrEmpty(googleId))
                return null;

            return await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.GoogleId == googleId);
        }

        public async Task<object> GetUnconfirmedUsersCountAsync()
        {
            var unconfirmedCount = await _context.Users.Where(u => !u.EmailConfirmed).CountAsync();

            var expiredCount = await _context
                .Users.Where(u =>
                    !u.EmailConfirmed && u.EmailConfirmationTokenExpiry < DateTime.UtcNow
                )
                .CountAsync();

            return new
            {
                totalUnconfirmed = unconfirmedCount,
                expiredUnconfirmed = expiredCount,
                message = "Automatic cleanup runs every 24 hours. Expired users are deleted after 7 days."
            };
        }

        public async Task<bool> UpdateUser(AppUser user)
        {
            try
            {
                var userToUpdate = await _context.Users.FindAsync(user.Id);
                if (userToUpdate != null)
                {
                    _context.Entry(userToUpdate).CurrentValues.SetValues(user);
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> UpdateUsername(string currentUsername, string newUsername)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.UserName == currentUsername.ToLower()
                );
                if (user == null)
                    return false;

                user.UserName = newUsername.ToLower();
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
