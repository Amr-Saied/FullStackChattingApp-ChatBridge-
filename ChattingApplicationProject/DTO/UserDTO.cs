namespace ChattingApplicationProject.DTO
{
    public class UserDTO
    {
        public string? Username { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string? Role { get; set; }
        public DateTime? TokenExpires { get; set; }
        public DateTime? RefreshTokenExpires { get; set; }
    }
}
