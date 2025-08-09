using ChattingApplicationProject.Models;
using System.Security.Claims;

namespace ChattingApplicationProject.Interfaces
{
    public interface ITokenService
    {
        public string CreateToken(AppUser user);
        public string CreateRefreshToken(AppUser user);
        public ClaimsPrincipal? ValidateRefreshToken(string refreshToken);
        public int? GetUserIdFromToken(string token);
    }
}
