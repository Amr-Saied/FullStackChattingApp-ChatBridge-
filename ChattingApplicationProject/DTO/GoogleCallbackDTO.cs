using System.ComponentModel.DataAnnotations;

namespace ChattingApplicationProject.DTO
{
    public class GoogleCallbackDTO
    {
        [Required]
        public string? Code { get; set; }
    }
}
