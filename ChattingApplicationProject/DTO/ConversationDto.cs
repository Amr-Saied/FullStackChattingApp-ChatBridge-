using System;

namespace ChattingApplicationProject.DTO
{
    public class ConversationDto
    {
        public int OtherUserId { get; set; }
        public string OtherUsername { get; set; }
        public string? OtherUserPhotoUrl { get; set; }
        public string LastMessage { get; set; }
        public DateTime LastMessageTime { get; set; }
        public int UnreadCount { get; set; }
    }
}
