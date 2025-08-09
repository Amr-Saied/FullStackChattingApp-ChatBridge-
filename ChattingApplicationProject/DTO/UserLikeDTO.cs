using System;

namespace ChattingApplicationProject.DTO
{
    public class UserLikeDTO
    {
        public int Id { get; set; }
        public int SourceUserId { get; set; }
        public int LikedUserId { get; set; }
        public DateTime Created { get; set; }

        // Navigation properties for detailed info
        public string? SourceUserName { get; set; }
        public string? LikedUserName { get; set; }
        public string? SourceUserPhotoUrl { get; set; }
        public string? LikedUserPhotoUrl { get; set; }
    }
}
