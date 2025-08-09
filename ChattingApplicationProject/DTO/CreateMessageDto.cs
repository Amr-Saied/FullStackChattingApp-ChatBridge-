namespace ChattingApplicationProject.DTO
{
    public class CreateMessageDto
    {
        public int RecipientId { get; set; }
        public string Content { get; set; }
        public string? Emoji { get; set; }
    }
}
