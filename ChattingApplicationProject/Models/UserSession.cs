using System.ComponentModel.DataAnnotations;

namespace ChattingApplicationProject.Models
{
    public class UserSession
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public string SessionToken { get; set; } = string.Empty;

        [Required]
        public string RefreshToken { get; set; } = string.Empty;

        [Required]
        public string DeviceInfo { get; set; } = string.Empty;

        [Required]
        public string IpAddress { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastActivity { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation property
        public AppUser User { get; set; } = null!;
    }
}
