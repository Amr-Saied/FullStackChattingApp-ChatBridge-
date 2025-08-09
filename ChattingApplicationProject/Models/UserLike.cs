namespace ChattingApplicationProject.Models
{
    public class UserLike
    {
        public int Id { get; set; }

        // The user who is doing the liking
        public int SourceUserId { get; set; }
        public AppUser? SourceUser { get; set; }

        // The user who is being liked
        public int LikedUserId { get; set; }
        public AppUser? LikedUser { get; set; }

        // When the like was created
        public DateTime Created { get; set; } = DateTime.Now;
    }
}
