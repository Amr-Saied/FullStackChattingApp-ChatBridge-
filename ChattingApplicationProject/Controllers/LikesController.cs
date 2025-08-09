using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using ChattingApplicationProject.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChattingApplicationProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class LikesController : ControllerBase
    {
        private readonly ILikeService _likeService;

        public LikesController(ILikeService likeService)
        {
            _likeService = likeService;
        }

        [HttpPost("add-like")]
        public async Task<IActionResult> AddLike([FromBody] AddLikeRequest request)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            if (currentUserId == request.LikedUserId)
                return BadRequest("You cannot like yourself");

            var result = await _likeService.AddLike(currentUserId, request.LikedUserId);

            if (result)
                return Ok(new { success = true, message = "Like added successfully" });

            return BadRequest("Failed to add like or like already exists");
        }

        [HttpDelete("remove-like/{likedUserId}")]
        public async Task<IActionResult> RemoveLike(int likedUserId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var result = await _likeService.RemoveLike(currentUserId, likedUserId);

            if (result)
                return Ok(new { success = true, message = "Like removed successfully" });

            return BadRequest("Failed to remove like or like doesn't exist");
        }

        [HttpGet("check-like/{likedUserId}")]
        public async Task<IActionResult> CheckLike(int likedUserId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var hasLiked = await _likeService.HasUserLiked(currentUserId, likedUserId);
            return Ok(new { hasLiked });
        }

        [HttpGet("user-counts/{userId}")]
        public async Task<IActionResult> GetUserLikeCounts(int userId)
        {
            var likedByCount = await _likeService.GetUserLikedByCount(userId);
            return Ok(new { likedByCount });
        }

        [HttpGet("my-likes")]
        public async Task<IActionResult> GetMyLikes()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var likedUsers = await _likeService.GetUsersLikedByCurrentUser(currentUserId);
            return Ok(likedUsers);
        }

        [HttpGet("my-likes-paged")]
        public async Task<IActionResult> GetMyLikesPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 8
        )
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            // Validate pagination parameters
            if (pageNumber < 1)
                pageNumber = 1;
            if (pageSize < 1 || pageSize > 50)
                pageSize = 8;

            var result = await _likeService.GetUsersLikedByCurrentUserPaged(
                currentUserId,
                pageNumber,
                pageSize
            );
            return Ok(result);
        }

        private int GetCurrentUserId()
        {
            // Try both claim types since JWT uses NameId but some systems expect NameIdentifier
            var userIdClaim =
                User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }
    }

    public class AddLikeRequest
    {
        public int LikedUserId { get; set; }
    }
}
