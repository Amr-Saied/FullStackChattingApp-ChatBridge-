using System.Net;
using System.Net.Mail;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ChattingApplicationProject.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly DataContext _context;

        public EmailService(IConfiguration configuration, DataContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public async Task SendEmailConfirmationAsync(
            string email,
            string username,
            string confirmationLink
        )
        {
            var subject = "Confirm Your Email - ChatBridge";
            var body =
                $@"
                <h2>Welcome to ChattingApp!</h2>
                <p>Hi {username},</p>
                <p>Thank you for registering with ChattingApp. Please confirm your email address by clicking the link below:</p>
                <p><a href='{confirmationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Confirm Email</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{confirmationLink}</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>The ChatBridge Team</p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetAsync(string email, string username, string resetLink)
        {
            var subject = "Reset Your Password - ChatBridge";
            var body =
                $@"
                <h2>Password Reset Request</h2>
                <p>Hi {username},</p>
                <p>We received a request to reset your password. Click the link below to create a new password:</p>
                <p><a href='{resetLink}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Reset Password</a></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{resetLink}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>The ChatBridge Team</p>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendUsernameReminderAsync(string email, string username)
        {
            var subject = "Your Username - ChatBridge";
            var body =
                $@"
                <h2>Username Reminder</h2>
                <p>Hi there,</p>
                <p>You requested a reminder of your username. Here it is:</p>
                <p><strong>Username: {username}</strong></p>
                <p>You can now log in to your account.</p>
                <p>Best regards,<br>The ChatBridge Team</p>";

            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                var smtpServer = smtpSettings["Server"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(smtpSettings["Port"] ?? "587");
                var smtpUsername = smtpSettings["Username"];
                var smtpPassword = smtpSettings["Password"];

                using var client = new SmtpClient(smtpServer, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(smtpUsername, smtpPassword)
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(smtpUsername ?? "noreply@chattingapp.com"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                // Log the error silently for production
            }
        }

        // Email-related user operations
        public async Task<bool> EmailExists(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<AppUser?> GetUserByEmail(string email)
        {
            return await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<AppUser?> GetUserByEmailConfirmationToken(string token)
        {
            return await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token);
        }

        public async Task<AppUser?> GetUserByPasswordResetToken(string token)
        {
            return await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
        }

        public async Task UpdateUser(AppUser user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}
