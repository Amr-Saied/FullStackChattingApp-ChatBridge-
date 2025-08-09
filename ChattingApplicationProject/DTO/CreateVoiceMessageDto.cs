using Microsoft.AspNetCore.Http;

namespace ChattingApplicationProject.DTO
{
    public class CreateVoiceMessageDto
    {
        public int RecipientId { get; set; }
        public IFormFile VoiceFile { get; set; }
        public int Duration { get; set; } // Duration in seconds
    }
}
