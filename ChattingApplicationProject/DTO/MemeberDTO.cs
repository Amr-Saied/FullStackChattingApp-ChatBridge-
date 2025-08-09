using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChattingApplicationProject.DTO
{
    public class MemeberDTO
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
        public string? Role { get; set; }
        public string? PhotoUrl { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? KnownAs { get; set; }
        public DateTime Created { get; set; } = DateTime.Now;
        public DateTime LastActive { get; set; } = DateTime.Now;
        public string? Gender { get; set; }
        public string? Introduction { get; set; }
        public string? LookingFor { get; set; }
        public string? Interests { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public int age { get; set; }
        public ICollection<PhotoDTO>? Photos { get; set; }

        // Like-related properties
        public bool IsLikedByCurrentUser { get; set; }
        public bool HasLikedCurrentUser { get; set; }
        public int LikesCount { get; set; }
    }
}
