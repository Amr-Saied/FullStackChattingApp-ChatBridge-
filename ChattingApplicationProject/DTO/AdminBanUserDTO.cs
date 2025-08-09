namespace ChattingApplicationProject.DTO
{
    public class AdminBanUserDTO
    {
        public int UserId { get; set; }
        public string? BanReason { get; set; }
        public DateTime? BanExpiryDate { get; set; }
        public bool IsPermanentBan { get; set; }
    }
}
