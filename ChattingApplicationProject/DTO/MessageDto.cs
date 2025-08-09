using System;

namespace ChattingApplicationProject.DTO
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderUsername { get; set; }
        public string SenderPhotoUrl { get; set; }
        public int RecipientId { get; set; }
        public string RecipientUsername { get; set; }
        public string RecipientPhotoUrl { get; set; }
        public string Content { get; set; }
        public string Emoji { get; set; }
        public string VoiceUrl { get; set; }
        public int? VoiceDuration { get; set; }
        public string MessageType { get; set; }
        public DateTime MessageSent { get; set; }
        public DateTime? DateRead { get; set; }
    }
}
