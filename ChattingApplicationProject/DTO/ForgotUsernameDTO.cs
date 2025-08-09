using System.ComponentModel.DataAnnotations;

namespace ChattingApplicationProject.DTO
{
    public class ForgotUsernameDTO
    {
        [Required]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public string? Email { get; set; }
    }
}
