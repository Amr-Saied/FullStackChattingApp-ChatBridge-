using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AutoMapper;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Helpers.helperClasses;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using ChattingApplicationProject.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;

namespace ChattingApplicationProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IAdminService _adminService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ISessionService _sessionService;

        public AccountController(
            IUserService userService,
            ITokenService tokenService,
            IMapper mapper,
            IAdminService adminService,
            IEmailService emailService,
            IConfiguration configuration,
            ISessionService sessionService
        )
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
            _adminService = adminService;
            _emailService = emailService;
            _configuration = configuration;
            _sessionService = sessionService;
        }

        [HttpPost("Register")]
        public async Task<ActionResult<UserDTO>> Register(RegisterDTO registerDto)
        {
            if (await _userService.UserExists(registerDto.Username ?? string.Empty))
                return BadRequest("Username is taken");

            if (await _emailService.EmailExists(registerDto.Email ?? string.Empty))
                return BadRequest("Email is already registered");

            using var hmac = new HMACSHA512();

            // Use AutoMapper to map RegisterDTO to AppUser
            var user = _mapper.Map<AppUser>(registerDto);

            // Set password hash and salt
            user.PasswordHash = hmac.ComputeHash(
                Encoding.UTF8.GetBytes(registerDto.Password ?? string.Empty)
            );
            user.PasswordSalt = hmac.Key;

            // Generate email confirmation token
            user.EmailConfirmationToken = Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(32)
            );
            user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);

            await _userService.AddUser(user);

            // Send confirmation email
            var confirmationLink =
                $"{Request.Scheme}://{Request.Host}/Account/ConfirmEmail?token={user.EmailConfirmationToken}";
            await _emailService.SendEmailConfirmationAsync(
                user.Email!,
                user.UserName!,
                confirmationLink
            );

            return Ok(
                new
                {
                    message = "Registration successful. Please check your email to confirm your account."
                }
            );
        }

        [HttpPost("Login")]
        public async Task<ActionResult<object>> Login(LoginDTO loginDto)
        {
            var user = await _userService.GetUserByUsername(loginDto.Username ?? string.Empty);
            if (user == null)
                return Unauthorized("Invalid username");

            if (user.PasswordSalt == null)
                return Unauthorized("Invalid user data");

            using var hmac = new HMACSHA512(user.PasswordSalt);
            var computedHash = hmac.ComputeHash(
                Encoding.UTF8.GetBytes(loginDto.Password ?? string.Empty)
            );

            if (user.PasswordHash == null)
                return Unauthorized("Invalid user data");

            for (int i = 0; i < computedHash.Length; i++)
            {
                if (computedHash[i] != user.PasswordHash[i])
                    return Unauthorized("Invalid password");
            }

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                return BadRequest(
                    new
                    {
                        error = "EMAIL_NOT_CONFIRMED",
                        message = "Please confirm your email address before logging in. Check your inbox for the confirmation link.",
                        email = user.Email
                    }
                );
            }

            // Check if user is banned - this will automatically unban expired users
            var isBanned = await _adminService.IsUserBannedAsync(user.Id);
            if (isBanned)
            {
                // Get updated user details after potential unban
                var userDetails = await _adminService.GetUserForAdminAsync(user.Id);
                if (userDetails != null && userDetails.IsBanned)
                {
                    var banMessage = "Your account has been banned.";
                    if (!string.IsNullOrEmpty(userDetails.BanReason))
                    {
                        banMessage += $" Reason: {userDetails.BanReason}";
                    }
                    if (!userDetails.IsPermanentBan && userDetails.BanExpiryDate.HasValue)
                    {
                        banMessage +=
                            $" Your ban expires on: {userDetails.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")}";
                    }

                    banMessage += " Please contact an administrator for more information.";
                    return BadRequest(
                        new
                        {
                            error = "USER_BANNED",
                            message = banMessage,
                            isPermanentBan = userDetails.IsPermanentBan,
                            banExpiryDate = userDetails.BanExpiryDate.HasValue
                                ? userDetails.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")
                                : null,
                            banReason = userDetails.BanReason
                        }
                    );
                }
            }

            // Create tokens
            var accessToken = _tokenService.CreateToken(user);
            var refreshToken = _tokenService.CreateRefreshToken(user);

            // Get client information
            var clientDeviceInfo = Request.Headers["User-Agent"].ToString();
            var clientIpAddress =
                Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            // Create new session
            await _sessionService.CreateSessionAsync(
                user.Id,
                accessToken,
                refreshToken,
                clientDeviceInfo,
                clientIpAddress
            );

            return new UserDTO
            {
                Username = user.UserName,
                Token = accessToken,
                RefreshToken = refreshToken,
                Role = user.Role,
                TokenExpires = DateTime.Now.AddMinutes(15),
                RefreshTokenExpires = DateTime.Now.AddDays(7)
            };
        }

        [HttpGet("CheckBanStatus/{userId}")]
        public async Task<ActionResult> CheckCurrentUserBanStatus(int userId)
        {
            try
            {
                var user = await _adminService.GetUserForAdminAsync(userId);
                if (user == null)
                {
                    return Ok(new { userId, isBanned = false });
                }

                // Build complete ban message (same format as login response)
                var banMessage = "Your account has been banned.";
                if (!string.IsNullOrEmpty(user.BanReason))
                {
                    banMessage += $" Reason: {user.BanReason}";
                }
                if (!user.IsPermanentBan && user.BanExpiryDate.HasValue)
                {
                    banMessage +=
                        $" Your ban expires on: {user.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")}";
                }
                banMessage += " Please contact an administrator for more information.";

                return Ok(
                    new
                    {
                        userId,
                        isBanned = user.IsBanned,
                        message = banMessage,
                        banReason = user.BanReason,
                        isPermanentBan = user.IsPermanentBan,
                        banExpiryDate = user.BanExpiryDate.HasValue
                            ? user.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")
                            : null
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest($"Error checking ban status: {ex.Message}");
            }
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
        {
            var user = await _emailService.GetUserByEmailConfirmationToken(token);

            if (user == null)
                return Content(
                    GetErrorHtml(
                        "Invalid confirmation token",
                        "The confirmation link is invalid or has already been used."
                    ),
                    "text/html"
                );

            if (user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
                return Content(
                    GetErrorHtml(
                        "Confirmation token has expired",
                        "The confirmation link has expired. Please request a new confirmation email."
                    ),
                    "text/html"
                );

            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiry = null;

            await _emailService.UpdateUser(user);
            return Content(GetSuccessHtml(user.UserName!), "text/html");
        }

        private string GetSuccessHtml(string username)
        {
            var baseUrl = $"https://angular-chatting-app-front-end.vercel.app";
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Email Confirmed - ChattingApp</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        
        .container {{
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
        }}
        
        .success-icon {{
            width: 80px;
            height: 80px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: bounce 0.6s ease-in-out;
        }}
        
        .success-icon::after {{
            content: '✓';
            color: white;
            font-size: 40px;
            font-weight: bold;
        }}
        
        @keyframes bounce {{
            0%, 20%, 50%, 80%, 100% {{ transform: translateY(0); }}
            40% {{ transform: translateY(-10px); }}
            60% {{ transform: translateY(-5px); }}
        }}
        
        h1 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 28px;
        }}
        
        p {{
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
            font-size: 16px;
        }}
        
        .username {{
            color: #667eea;
            font-weight: bold;
        }}
        
        .btn {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }}
        
        .features {{
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #eee;
        }}
        
        .features h3 {{
            color: #333;
            margin-bottom: 15px;
        }}
        
        .feature-list {{
            list-style: none;
            text-align: left;
        }}
        
        .feature-list li {{
            color: #666;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }}
        
        .feature-list li::before {{
            content: '✓';
            color: #4CAF50;
            position: absolute;
            left: 0;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='success-icon'></div>
        <h1>Email Confirmed Successfully!</h1>
        <p>Welcome to ChattingApp, <span class='username'>{username}</span>! Your email has been verified and your account is now active.</p>
        
        <a href='{baseUrl}/' class='btn'>Go to Login</a>
        
        <div class='features'>
            <h3>What's Next?</h3>
            <ul class='feature-list'>
                <li>Log in to your account</li>
                <li>Complete your profile</li>
                <li>Start chatting with other users</li>
                <li>Upload photos and share moments</li>
            </ul>
        </div>
    </div>
</body>
</html>";
        }

        private string GetErrorHtml(string title, string message)
        {
            var baseUrl = $"https://angular-chatting-app-front-end.vercel.app";
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Email Confirmation Error - ChattingApp</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        
        .container {{
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
        }}
        
        .error-icon {{
            width: 80px;
            height: 80px;
            background: #ff6b6b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
        }}
        
        .error-icon::after {{
            content: '✕';
            color: white;
            font-size: 40px;
            font-weight: bold;
        }}
        
        h1 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 28px;
        }}
        
        p {{
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
            font-size: 16px;
        }}
        
        .btn {{
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='error-icon'></div>
        <h1>{title}</h1>
        <p>{message}</p>
        
        <a href='{baseUrl}/' class='btn'>Go to Login</a>
    </div>
</body>
</html>";
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDTO forgotPasswordDto)
        {
            var user = await _emailService.GetUserByEmail(forgotPasswordDto.Email ?? string.Empty);

            if (user == null)
                return Ok(
                    new
                    {
                        message = "If an account with this email exists, a password reset link has been sent."
                    }
                );

            // Generate password reset token
            user.PasswordResetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

            await _emailService.UpdateUser(user);

            // Send password reset email
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://chatbridge.runasp.net";
            var encodedToken = Uri.EscapeDataString(user.PasswordResetToken);
            var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}";
            await _emailService.SendPasswordResetAsync(user.Email!, user.UserName!, resetLink);

            return Ok(
                new
                {
                    message = "If an account with this email exists, a password reset link has been sent."
                }
            );
        }

        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDTO resetPasswordDto)
        {
            var user = await _emailService.GetUserByPasswordResetToken(
                resetPasswordDto.Token ?? string.Empty
            );

            if (user == null)
                return BadRequest("Invalid reset token");

            if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
                return BadRequest("Reset token has expired");

            // Check if new password is the same as old password
            if (user.PasswordSalt != null)
            {
                using var hmac = new HMACSHA512(user.PasswordSalt);
                var computedHash = hmac.ComputeHash(
                    Encoding.UTF8.GetBytes(resetPasswordDto.NewPassword ?? string.Empty)
                );

                if (user.PasswordHash != null)
                {
                    bool isSamePassword = true;
                    for (int i = 0; i < computedHash.Length; i++)
                    {
                        if (computedHash[i] != user.PasswordHash[i])
                        {
                            isSamePassword = false;
                            break;
                        }
                    }

                    if (isSamePassword)
                        return BadRequest(
                            "New password cannot be the same as your current password"
                        );
                }
            }

            // Update password
            using var newHmac = new HMACSHA512();
            user.PasswordHash = newHmac.ComputeHash(
                Encoding.UTF8.GetBytes(resetPasswordDto.NewPassword ?? string.Empty)
            );
            user.PasswordSalt = newHmac.Key;
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;

            await _emailService.UpdateUser(user);

            return Ok(new { message = "Password reset successfully!" });
        }

        [HttpPost("ForgotUsername")]
        public async Task<IActionResult> ForgotUsername(ForgotUsernameDTO forgotUsernameDto)
        {
            var user = await _emailService.GetUserByEmail(forgotUsernameDto.Email ?? string.Empty);

            if (user == null)
                return Ok(
                    new
                    {
                        message = "If an account with this email exists, a username reminder has been sent."
                    }
                );

            // Send username reminder email
            await _emailService.SendUsernameReminderAsync(user.Email!, user.UserName!);

            return Ok(
                new
                {
                    message = "If an account with this email exists, a username reminder has been sent."
                }
            );
        }

        [HttpPost("ResendConfirmation")]
        public async Task<IActionResult> ResendConfirmationEmail(
            [FromBody] ResendConfirmationDTO resendDto
        )
        {
            var user = await _emailService.GetUserByEmail(resendDto.Email ?? string.Empty);

            if (user == null)
                return Ok(
                    new
                    {
                        message = "If an account with this email exists, a confirmation email has been sent."
                    }
                );

            if (user.EmailConfirmed)
                return Ok(new { message = "Your email is already confirmed." });

            // Generate new confirmation token
            user.EmailConfirmationToken = Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(32)
            );
            user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);

            await _emailService.UpdateUser(user);

            // Send new confirmation email
            var confirmationLink =
                $"{Request.Scheme}://{Request.Host}/Account/ConfirmEmail?token={user.EmailConfirmationToken}";
            await _emailService.SendEmailConfirmationAsync(
                user.Email!,
                user.UserName!,
                confirmationLink
            );

            return Ok(
                new
                {
                    message = "If an account with this email exists, a new confirmation email has been sent."
                }
            );
        }

        [HttpPost("GoogleLogin")]
        public async Task<ActionResult<object>> GoogleLogin(GoogleLoginDTO googleLoginDto)
        {
            try
            {
                // First, check if user exists with this Google ID (existing Google user)
                var existingUser = await _userService.GetUserByGoogleId(googleLoginDto.GoogleId);

                if (existingUser != null)
                {
                    // User exists with this Google ID, check if banned
                    var isBanned = await _adminService.IsUserBannedAsync(existingUser.Id);
                    if (isBanned)
                    {
                        var userDetails = await _adminService.GetUserForAdminAsync(existingUser.Id);
                        if (userDetails != null && userDetails.IsBanned)
                        {
                            var banMessage = "Your account has been banned.";
                            if (!string.IsNullOrEmpty(userDetails.BanReason))
                            {
                                banMessage += $" Reason: {userDetails.BanReason}";
                            }
                            if (!userDetails.IsPermanentBan && userDetails.BanExpiryDate.HasValue)
                            {
                                banMessage +=
                                    $" Your ban expires on: {userDetails.BanExpiryDate.Value.ToString("MM/dd/yyyy hh:mm tt")}";
                            }
                            banMessage += " Please contact an administrator for more information.";

                            return BadRequest(
                                new
                                {
                                    error = "USER_BANNED",
                                    message = banMessage,
                                    isPermanentBan = userDetails.IsPermanentBan,
                                    banExpiryDate = userDetails.BanExpiryDate.HasValue
                                        ? userDetails.BanExpiryDate.Value.ToString(
                                            "MM/dd/yyyy hh:mm tt"
                                        )
                                        : null,
                                    banReason = userDetails.BanReason
                                }
                            );
                        }
                    }

                    // Update last active time
                    existingUser.LastActive = DateTime.Now;
                    await _userService.UpdateUser(existingUser);

                    return new UserDTO
                    {
                        Username = existingUser.UserName,
                        Token = _tokenService.CreateToken(existingUser),
                        Role = existingUser.Role
                    };
                }

                // Check if a user with the same email already exists (regular user with password)
                var existingUserByEmail = await _emailService.GetUserByEmail(googleLoginDto.Email);
                if (existingUserByEmail != null)
                {
                    // User with this email exists but doesn't have Google ID
                    // This means they registered with email/password
                    return BadRequest(
                        new
                        {
                            error = "EMAIL_ALREADY_EXISTS",
                            message = "An account with this email already exists. Please use your username and password to login, or use a different Google account.",
                            existingUsername = existingUserByEmail.UserName
                        }
                    );
                }

                // User doesn't exist, create new Google user
                var newUser = new AppUser
                {
                    UserName = GenerateUniqueUsername(googleLoginDto.Email),
                    Email = googleLoginDto.Email,
                    GoogleId = googleLoginDto.GoogleId,
                    ProfilePictureUrl = googleLoginDto.Picture,
                    KnownAs = googleLoginDto.Name,
                    IsGoogleUser = true,
                    EmailConfirmed = true, // Google users are pre-verified
                    DateOfBirth = DateTime.Now.AddYears(-18), // Default age, user can update later
                    Gender = "Other", // Default gender, user can update later
                    Created = DateTime.Now,
                    LastActive = DateTime.Now,
                    Role = "User"
                };

                await _userService.AddUser(newUser);

                return new UserDTO
                {
                    Username = newUser.UserName,
                    Token = _tokenService.CreateToken(newUser),
                    Role = newUser.Role
                };
            }
            catch (Exception ex)
            {
                return BadRequest($"Google login failed: {ex.Message}");
            }
        }

        // Helper method to generate unique username
        private string GenerateUniqueUsername(string email)
        {
            var baseUsername = email.Split('@')[0];
            var username = baseUsername;
            var counter = 1;

            // Keep trying until we find a unique username
            while (_userService.UserExists(username).Result)
            {
                username = $"{baseUsername}_{counter}";
                counter++;
            }

            return username;
        }

        [HttpGet("GoogleCallback")]
        public async Task<IActionResult> GoogleCallback([FromQuery] string code)
        {
            try
            {
                // Exchange authorization code for tokens
                var tokenResponse = await ExchangeCodeForTokens(code);

                // Get user info from Google
                var userInfo = await GetGoogleUserInfo(tokenResponse.AccessToken);

                // Check if user exists with this Google ID
                var existingUser = await _userService.GetUserByGoogleId(userInfo.Subject);

                // Get frontend URL once
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://chatbridge.runasp.net";

                if (existingUser != null)
                {
                    // User exists, check if banned
                    var isBanned = await _adminService.IsUserBannedAsync(existingUser.Id);
                    if (isBanned)
                    {
                        return Redirect($"{frontendUrl}/login?error=banned");
                    }

                    // Redirect to frontend with success
                    return Redirect(
                        $"{frontendUrl}/login?google=success&username={existingUser.UserName}"
                    );
                }

                // Check if a user with the same email already exists
                var existingUserByEmail = await _emailService.GetUserByEmail(userInfo.Email);
                if (existingUserByEmail != null)
                {
                    // User with this email exists but doesn't have Google ID
                    // This means they registered with email/password
                    return Redirect(
                        $"{frontendUrl}/login?error=email_exists&username={existingUserByEmail.UserName}"
                    );
                }

                // User doesn't exist, create new user
                var newUser = new AppUser
                {
                    UserName =
                        userInfo.Email?.Split('@')[0]
                        + "_"
                        + Guid.NewGuid().ToString().Substring(0, 8),
                    Email = userInfo.Email,
                    GoogleId = userInfo.Subject,
                    ProfilePictureUrl = userInfo.Picture,
                    KnownAs = userInfo.Name,
                    IsGoogleUser = true,
                    EmailConfirmed = true,
                    DateOfBirth = DateTime.Now.AddYears(-18),
                    Gender = "Other",
                    Created = DateTime.Now,
                    LastActive = DateTime.Now,
                    Role = "User"
                };

                await _userService.AddUser(newUser);

                // Redirect to frontend with success
                return Redirect($"{frontendUrl}/login?google=success&username={newUser.UserName}");
            }
            catch (Exception ex)
            {
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://chatbridge.runasp.net";
                return Redirect($"{frontendUrl}/login?error=google_failed");
            }
        }

        private async Task<GoogleTokenResponse> ExchangeCodeForTokens(string code)
        {
            using var client = new HttpClient();

            var googleSettings = _configuration.GetSection("GoogleSettings").Get<GoogleSettings>();
            if (
                googleSettings == null
                || string.IsNullOrEmpty(googleSettings.ClientId)
                || string.IsNullOrEmpty(googleSettings.ClientSecret)
            )
            {
                throw new Exception("Google OAuth credentials not configured");
            }

            var tokenRequest = new FormUrlEncodedContent(
                new[]
                {
                    new KeyValuePair<string, string>("code", code),
                    new KeyValuePair<string, string>("client_id", googleSettings.ClientId),
                    new KeyValuePair<string, string>("client_secret", googleSettings.ClientSecret),
                    new KeyValuePair<string, string>(
                        "redirect_uri",
                        $"{Request.Scheme}://{Request.Host}/Account/GoogleCallback"
                    ),
                    new KeyValuePair<string, string>("grant_type", "authorization_code")
                }
            );

            var response = await client.PostAsync(
                "https://oauth2.googleapis.com/token",
                tokenRequest
            );
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to exchange code for tokens: {responseContent}");
            }

            return JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent);
        }

        private async Task<GoogleUserInfo> GetGoogleUserInfo(string accessToken)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

            var response = await client.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to get user info: {responseContent}");
            }

            return JsonSerializer.Deserialize<GoogleUserInfo>(responseContent);
        }

        [HttpGet("CheckUsernameAvailability/{username}")]
        public async Task<ActionResult<object>> CheckUsernameAvailability(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest("Username cannot be empty");

            var isTaken = await _userService.UserExists(username);
            return Ok(new { isAvailable = !isTaken, username = username });
        }

        [HttpPost("UpdateUsername")]
        public async Task<ActionResult<object>> UpdateUsername(
            [FromBody] UpdateUsernameDTO updateUsernameDto
        )
        {
            if (string.IsNullOrWhiteSpace(updateUsernameDto.NewUsername))
                return BadRequest("Username cannot be empty");

            // Check if the new username is already taken
            if (await _userService.UserExists(updateUsernameDto.NewUsername))
                return BadRequest("Username is already taken");

            // Update the username using the service
            var success = await _userService.UpdateUsername(
                updateUsernameDto.CurrentUsername,
                updateUsernameDto.NewUsername
            );
            if (!success)
                return NotFound("User not found");

            return Ok(
                new
                {
                    message = "Username updated successfully",
                    newUsername = updateUsernameDto.NewUsername.ToLower()
                }
            );
        }

        [HttpPost("Logout")]
        public async Task<ActionResult> Logout()
        {
            try
            {
                // Get the authorization header
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    return Unauthorized("No valid token provided");
                }

                var token = authHeader.Substring("Bearer ".Length);

                // Get user ID from token
                var userId = _tokenService.GetUserIdFromToken(token);
                if (userId == null)
                {
                    return Unauthorized("Invalid token");
                }

                // Invalidate all sessions for this user
                await _sessionService.InvalidateUserSessionsAsync(userId.Value);

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error during logout", error = ex.Message });
            }
        }

        [HttpPost("RefreshToken")]
        public async Task<ActionResult<UserDTO>> RefreshToken(
            [FromBody] RefreshTokenDto refreshTokenDto
        )
        {
            try
            {
                // Validate refresh token
                var principal = _tokenService.ValidateRefreshToken(refreshTokenDto.RefreshToken);
                if (principal == null)
                {
                    return Unauthorized("Invalid refresh token");
                }

                // Get user ID from refresh token
                var userId = _tokenService.GetUserIdFromToken(refreshTokenDto.RefreshToken);
                if (userId == null)
                {
                    return Unauthorized("Invalid user in refresh token");
                }

                // Get user from database
                var user = await _userService.GetUserById(userId.Value);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                // Check if user is banned
                var isBanned = await _adminService.IsUserBannedAsync(user.Id);
                if (isBanned)
                {
                    return Unauthorized("User account is banned");
                }

                // Create new tokens
                var newAccessToken = _tokenService.CreateToken(user);
                var newRefreshToken = _tokenService.CreateRefreshToken(user);

                // Find the existing session by refresh token
                var existingSession = await _sessionService.GetSessionByRefreshToken(
                    refreshTokenDto.RefreshToken
                );

                if (existingSession != null)
                {
                    existingSession.SessionToken = newAccessToken;
                    existingSession.RefreshToken = newRefreshToken;
                    existingSession.LastActivity = DateTime.UtcNow;

                    // Save the updated session
                    await _sessionService.UpdateSessionTokensAsync(existingSession);
                }

                return new UserDTO
                {
                    Username = user.UserName,
                    Token = newAccessToken,
                    RefreshToken = newRefreshToken,
                    Role = user.Role,
                    TokenExpires = DateTime.Now.AddMinutes(15),
                    RefreshTokenExpires = DateTime.Now.AddDays(7)
                };
            }
            catch (Exception ex)
            {
                return BadRequest($"Error refreshing token: {ex.Message}");
            }
        }
    }
}
