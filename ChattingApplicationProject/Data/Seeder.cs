using System.Text.Json;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Data
{
    public class Seeder
    {
        public static async Task SeedUsers(DataContext context)
        {
            var user = await context.Users.ToListAsync();
            if (user.Count > 0)
                return;

            var userData = await File.ReadAllTextAsync("Data/GeneratedUsers.json");
            var users = JsonSerializer.Deserialize<List<AppUser>>(userData);

            if (users == null)
                return;

            foreach (var seedUser in users)
            {
                if (seedUser.UserName != null)
                {
                    seedUser.UserName = seedUser.UserName.ToLower();
                }
                using var hmac = new System.Security.Cryptography.HMACSHA512();
                seedUser.PasswordHash = hmac.ComputeHash(
                    System.Text.Encoding.UTF8.GetBytes("password")
                );
                seedUser.PasswordSalt = hmac.Key;
                await context.Users.AddAsync(seedUser);
            }

            await context.SaveChangesAsync();
        }
    }
}
