using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChattingApplicationProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IUserService _userService;

        public AdminController(IAdminService adminService, IUserService userService)
        {
            _adminService = adminService;
            _userService = userService;
        }

        [HttpGet("GetAllUsers")]
        public async Task<ActionResult<PagedResult<AdminUserResponseDTO>>> GetAllUsers(
            [FromQuery] PaginationParams paginationParams
        )
        {
            var users = await _adminService.GetAllUsersForAdminAsync(paginationParams);
            return Ok(users);
        }

        [HttpGet("SearchUsers")]
        public async Task<ActionResult<IEnumerable<AdminUserResponseDTO>>> SearchUsers(
            [FromQuery] string searchTerm
        )
        {
            var users = await _adminService.SearchUsersForAdminAsync(searchTerm);
            return Ok(users);
        }

        [HttpGet("GetUser/{userId}")]
        public async Task<ActionResult<AdminUserResponseDTO>> GetUser(int userId)
        {
            var user = await _adminService.GetUserForAdminAsync(userId);
            if (user == null)
                return NotFound("User not found");

            return Ok(user);
        }

        [HttpPut("EditUser/{userId}")]
        public async Task<ActionResult<AdminUserResponseDTO>> EditUser(
            int userId,
            [FromBody] AdminEditUserDTO editUserDto
        )
        {
            if (editUserDto == null)
                return BadRequest("Invalid user data");

            var updatedUser = await _adminService.EditUserAsync(userId, editUserDto);
            if (updatedUser == null)
                return NotFound("User not found or update failed");

            return Ok(updatedUser);
        }

        [HttpPost("BanUser/{userId}")]
        public async Task<ActionResult> BanUser(int userId, [FromBody] AdminBanUserDTO banDto)
        {
            if (banDto == null)
                return BadRequest("Invalid ban data");

            // Validate ban data
            if (!banDto.IsPermanentBan && !banDto.BanExpiryDate.HasValue)
                return BadRequest("Temporary ban must have an expiry date");

            if (banDto.IsPermanentBan && banDto.BanExpiryDate.HasValue)
                return BadRequest("Permanent ban should not have an expiry date");

            var result = await _adminService.BanUserAsync(userId, banDto);
            if (!result)
                return NotFound("User not found or ban failed");

            return Ok(new { message = "User banned successfully" });
        }

        [HttpPost("UnbanUser/{userId}")]
        public async Task<ActionResult> UnbanUser(int userId)
        {
            var result = await _adminService.UnbanUserAsync(userId);
            if (!result)
                return NotFound("User not found or unban failed");

            return Ok(new { message = "User unbanned successfully" });
        }

        [HttpDelete("DeleteUser/{userId}")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            var result = await _adminService.DeleteUserAsync(userId);
            if (!result)
                return NotFound("User not found or deletion failed");

            return Ok(new { message = "User deleted successfully" });
        }

        [HttpGet("CheckUserBanStatus/{userId}")]
        public async Task<ActionResult> CheckUserBanStatus(int userId)
        {
            var isBanned = await _adminService.IsUserBannedAsync(userId);
            return Ok(new { userId, isBanned });
        }

        [HttpPost("RefreshBanStatus")]
        public ActionResult RefreshBanStatus()
        {
            _adminService.CheckAndUnbanExpiredUsers();
            return Ok(new { message = "Ban status refreshed successfully" });
        }

        [HttpGet("UnconfirmedUsersCount")]
        public async Task<IActionResult> GetUnconfirmedUsersCount()
        {
            try
            {
                var result = await _userService.GetUnconfirmedUsersCountAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to get counts: {ex.Message}");
            }
        }
    }
}
