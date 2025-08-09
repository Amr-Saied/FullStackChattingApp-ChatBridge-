using System.ComponentModel.DataAnnotations;

namespace ChattingApplicationProject.DTO
{
    public class GoogleLoginDTO
    {
        [Required]
        public string? GoogleId { get; set; }

        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        public string? Name { get; set; }
        public string? Picture { get; set; }
        public string? GivenName { get; set; }
        public string? FamilyName { get; set; }
    }
}
