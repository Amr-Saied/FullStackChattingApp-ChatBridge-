using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChattingApplicationProject.Models;

namespace ChattingApplicationProject.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailConfirmationAsync(string email, string username, string confirmationLink);
        Task SendPasswordResetAsync(string email, string username, string resetLink);
        Task SendUsernameReminderAsync(string email, string username);

        // Email-related user operations
        Task<bool> EmailExists(string email);
        Task<AppUser?> GetUserByEmail(string email);
        Task<AppUser?> GetUserByEmailConfirmationToken(string token);
        Task<AppUser?> GetUserByPasswordResetToken(string token);
        Task UpdateUser(AppUser user);
    }
}
