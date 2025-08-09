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
    public class LikesService : ILikeService
    {
        private readonly DataContext _context;
        private readonly GetAgeService _ageService;
        private readonly IMapper _mapper;

        public LikesService(DataContext context, IMapper mapper)
        {
            _context = context;
            _ageService = new GetAgeService();
            _mapper = mapper;
        }

        public async Task<bool> AddLike(int sourceUserId, int likedUserId)
        {
            // Check if like already exists
            var existingLike = await _context.UserLikes.FirstOrDefaultAsync(x =>
                x.SourceUserId == sourceUserId && x.LikedUserId == likedUserId
            );

            if (existingLike != null)
                return false; // Like already exists

            // Check if users exist
            var sourceUser = await _context.Users.FindAsync(sourceUserId);
            var likedUser = await _context.Users.FindAsync(likedUserId);

            if (sourceUser == null || likedUser == null)
                return false;

            // Create new like
            var userLike = new UserLike
            {
                SourceUserId = sourceUserId,
                LikedUserId = likedUserId,
                Created = DateTime.Now
            };

            _context.UserLikes.Add(userLike);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> RemoveLike(int sourceUserId, int likedUserId)
        {
            var like = await _context.UserLikes.FirstOrDefaultAsync(x =>
                x.SourceUserId == sourceUserId && x.LikedUserId == likedUserId
            );

            if (like == null)
                return false; // Like doesn't exist

            _context.UserLikes.Remove(like);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<bool> HasUserLiked(int sourceUserId, int likedUserId)
        {
            return await _context.UserLikes.AnyAsync(x =>
                x.SourceUserId == sourceUserId && x.LikedUserId == likedUserId
            );
        }

        public async Task<int> GetUserLikedByCount(int userId)
        {
            return await _context.UserLikes.CountAsync(x => x.LikedUserId == userId);
        }

        public async Task<List<MemeberDTO>> GetUsersLikedByCurrentUser(int currentUserId)
        {
            var likedUserIds = await _context
                .UserLikes.Where(x => x.SourceUserId == currentUserId)
                .Select(x => x.LikedUserId)
                .ToListAsync();

            if (!likedUserIds.Any())
                return new List<MemeberDTO>();

            var likedUsers = await _context
                .Users.Where(u => likedUserIds.Contains(u.Id))
                .Include(u => u.Photos)
                .ToListAsync();

            var result = new List<MemeberDTO>();
            foreach (var user in likedUsers)
            {
                var memberDto = _mapper.Map<MemeberDTO>(user);
                memberDto.age = _ageService.CalculateAge(user.DateOfBirth);
                result.Add(memberDto);
            }

            return result;
        }

        public async Task<PagedResult<MemeberDTO>> GetUsersLikedByCurrentUserPaged(
            int currentUserId,
            int pageNumber,
            int pageSize
        )
        {
            // Get total count of liked users
            var totalCount = await _context
                .UserLikes.Where(x => x.SourceUserId == currentUserId)
                .CountAsync();

            if (totalCount == 0)
                return new PagedResult<MemeberDTO>
                {
                    Items = new List<MemeberDTO>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = 0
                };

            // Get liked user IDs for current page
            var likedUserIds = await _context
                .UserLikes.Where(x => x.SourceUserId == currentUserId)
                .Select(x => x.LikedUserId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Get user details for the current page
            var likedUsers = await _context
                .Users.Where(u => likedUserIds.Contains(u.Id))
                .Include(u => u.Photos)
                .ToListAsync();

            var result = new List<MemeberDTO>();
            foreach (var user in likedUsers)
            {
                var memberDto = _mapper.Map<MemeberDTO>(user);
                memberDto.age = _ageService.CalculateAge(user.DateOfBirth);
                result.Add(memberDto);
            }

            return new PagedResult<MemeberDTO>
            {
                Items = result,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }
    }
}
