namespace ChattingApplicationProject.DTO
{
    public class AdminUserResponseDTO
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
        public string? KnownAs { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Introduction { get; set; }
        public string? LookingFor { get; set; }
        public string? Interests { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Role { get; set; }
        public DateTime Created { get; set; }
        public DateTime LastActive { get; set; }
        public bool IsBanned { get; set; }
        public string? BanReason { get; set; }
        public DateTime? BanExpiryDate { get; set; }
        public bool IsPermanentBan { get; set; }
        public string? PhotoUrl { get; set; }
        public int Age { get; set; }
    }
}
