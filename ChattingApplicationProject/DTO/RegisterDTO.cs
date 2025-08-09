using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChattingApplicationProject.DTO
{
    public class RegisterDTO
    {
        [Required]
        [StringLength(
            50,
            MinimumLength = 3,
            ErrorMessage = "Username must be between 3 and 50 characters"
        )]
        [RegularExpression(
            @"^[a-zA-Z0-9_]+$",
            ErrorMessage = "Username can only contain letters, numbers, and underscores"
        )]
        public string? Username { get; set; }

        [Required]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public string? Email { get; set; }

        [Required]
        [StringLength(
            100,
            MinimumLength = 6,
            ErrorMessage = "Password must be at least 6 characters long"
        )]
        public string? Password { get; set; }

        [Required]
        [Display(Name = "Date of Birth")]
        public DateTime DateOfBirth { get; set; }

        [StringLength(50, ErrorMessage = "Known as must not exceed 50 characters")]
        [Display(Name = "Known As")]
        public string? KnownAs { get; set; }

        [Required]
        [Display(Name = "Gender")]
        public string? Gender { get; set; }

        [StringLength(100, ErrorMessage = "City must not exceed 100 characters")]
        public string? City { get; set; }

        [StringLength(100, ErrorMessage = "Country must not exceed 100 characters")]
        public string? Country { get; set; }
    }
}
