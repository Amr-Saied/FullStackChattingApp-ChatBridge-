using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ChattingApplicationProject.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Hubs
{
    [Authorize]
    public class MessageHub : Hub
    {
        // Thread-safe collections for scalability
        private static readonly ConcurrentDictionary<int, ConcurrentBag<string>> OnlineUsers =
            new();

        // Rate limiting to prevent spam
        private static readonly ConcurrentDictionary<string, DateTime> LastActionTime = new();
        private static readonly TimeSpan ActionCooldown = TimeSpan.FromMilliseconds(500);

        private readonly DataContext _context;
        private readonly ILogger<MessageHub> _logger;

        public MessageHub(DataContext context, ILogger<MessageHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var userId = Context.UserIdentifier;
                if (!int.TryParse(userId, out int userIdInt))
                {
                    _logger.LogWarning("Invalid user identifier: {UserId}", userId);
                    await base.OnConnectedAsync();
                    return;
                }

                _logger.LogInformation(
                    "User {UserId} connecting with connection {ConnectionId}",
                    userIdInt,
                    Context.ConnectionId
                );

                // Check if user is already online
                var isNewUser = !OnlineUsers.ContainsKey(userIdInt);

                // Add connection to user's connection list (thread-safe)
                OnlineUsers.AddOrUpdate(
                    userIdInt,
                    new ConcurrentBag<string> { Context.ConnectionId },
                    (key, existingConnections) =>
                    {
                        existingConnections.Add(Context.ConnectionId);
                        return existingConnections;
                    }
                );

                // Only notify if this is the first connection for this user
                if (isNewUser)
                {
                    await Clients.All.SendAsync("UserOnline", userIdInt);
                }

                // Send updated online users list to all clients
                await Clients.All.SendAsync("OnlineUsersUpdate", GetOnlineUserIds());

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in OnConnectedAsync for connection {ConnectionId}",
                    Context.ConnectionId
                );
                await base.OnConnectedAsync();
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            try
            {
                var userId = Context.UserIdentifier;
                if (!int.TryParse(userId, out int userIdInt))
                {
                    _logger.LogWarning("Invalid user identifier on disconnect: {UserId}", userId);
                    await base.OnDisconnectedAsync(exception);
                    return;
                }

                _logger.LogInformation(
                    "User {UserId} disconnecting connection {ConnectionId}",
                    userIdInt,
                    Context.ConnectionId
                );

                if (exception != null)
                {
                    _logger.LogWarning(
                        exception,
                        "User {UserId} disconnected with exception",
                        userIdInt
                    );
                }

                // Remove this specific connection (thread-safe)
                if (OnlineUsers.TryGetValue(userIdInt, out var connections))
                {
                    // Create new bag without the disconnected connection
                    var newConnections = new ConcurrentBag<string>(
                        connections.Where(c => c != Context.ConnectionId)
                    );

                    if (newConnections.IsEmpty)
                    {
                        // No connections left, remove user completely
                        OnlineUsers.TryRemove(userIdInt, out _);
                        await Clients.All.SendAsync("UserOffline", userIdInt);
                    }
                    else
                    {
                        // Update with remaining connections
                        OnlineUsers.TryUpdate(userIdInt, newConnections, connections);
                    }
                }

                // Send updated online users list
                await Clients.All.SendAsync("OnlineUsersUpdate", GetOnlineUserIds());

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in OnDisconnectedAsync for connection {ConnectionId}",
                    Context.ConnectionId
                );
                await base.OnDisconnectedAsync(exception);
            }
        }

        // Helper method to get current online user IDs (thread-safe)
        private List<int> GetOnlineUserIds()
        {
            return OnlineUsers.Keys.ToList();
        }

        // Rate limiting helper
        private bool IsRateLimited(string action)
        {
            var key = $"{Context.ConnectionId}_{action}";
            var now = DateTime.UtcNow;

            if (LastActionTime.TryGetValue(key, out var lastTime))
            {
                if (now - lastTime < ActionCooldown)
                {
                    return true; // Rate limited
                }
            }

            LastActionTime.AddOrUpdate(key, now, (k, v) => now);
            return false;
        }

        // Helper to get connection for user
        private string? GetUserConnection(int userId)
        {
            if (OnlineUsers.TryGetValue(userId, out var connections))
            {
                // Get the first available connection (most recent)
                return connections.FirstOrDefault();
            }
            return null;
        }

        public async Task SendMessage(int recipientId, string content)
        {
            try
            {
                var senderId = GetCurrentUserId();
                if (senderId == 0)
                {
                    _logger.LogWarning("SendMessage called with invalid user ID");
                    return;
                }

                // Get the recipient's connection
                var connectionId = GetUserConnection(recipientId);
                if (connectionId != null)
                {
                    // Send message to recipient
                    await Clients
                        .Client(connectionId)
                        .SendAsync(
                            "ReceiveMessage",
                            new
                            {
                                senderId = senderId,
                                recipientId = recipientId,
                                content = content,
                                messageSent = DateTime.UtcNow
                            }
                        );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage for user {UserId}", GetCurrentUserId());
            }
        }

        public async Task Typing(int recipientId)
        {
            try
            {
                // Rate limiting to prevent typing spam
                if (IsRateLimited("typing"))
                {
                    return;
                }

                var senderId = GetCurrentUserId();
                if (senderId == 0)
                {
                    _logger.LogWarning("Typing called with invalid user ID");
                    return;
                }

                var connectionId = GetUserConnection(recipientId);
                if (connectionId != null)
                {
                    await Clients.Client(connectionId).SendAsync("UserTyping", senderId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in Typing for user {UserId} to recipient {RecipientId}",
                    GetCurrentUserId(),
                    recipientId
                );
            }
        }

        public async Task StopTyping(int recipientId)
        {
            try
            {
                var senderId = GetCurrentUserId();
                if (senderId == 0)
                {
                    _logger.LogWarning("StopTyping called with invalid user ID");
                    return;
                }

                var connectionId = GetUserConnection(recipientId);
                if (connectionId != null)
                {
                    await Clients.Client(connectionId).SendAsync("UserStoppedTyping", senderId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in StopTyping for user {UserId} to recipient {RecipientId}",
                    GetCurrentUserId(),
                    recipientId
                );
            }
        }

        public async Task MarkAsRead(int messageId, int senderId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == 0)
                {
                    _logger.LogWarning("MarkAsRead called with invalid user ID");
                    return;
                }

                // Notify the sender that their message was read
                var connectionId = GetUserConnection(senderId);
                if (connectionId != null)
                {
                    await Clients
                        .Client(connectionId)
                        .SendAsync("MessageRead", messageId, currentUserId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in MarkAsRead for message {MessageId} by user {UserId}",
                    messageId,
                    GetCurrentUserId()
                );
            }
        }

        public async Task JoinUserGroup(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == 0)
                {
                    _logger.LogWarning("JoinUserGroup called with invalid user ID");
                    return;
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogDebug(
                    "User {CurrentUserId} joined group for user {UserId}",
                    currentUserId,
                    userId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining user group {UserId}", userId);
            }
        }

        public async Task LeaveUserGroup(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == 0)
                {
                    _logger.LogWarning("LeaveUserGroup called with invalid user ID");
                    return;
                }

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogDebug(
                    "User {CurrentUserId} left group for user {UserId}",
                    currentUserId,
                    userId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving user group {UserId}", userId);
            }
        }

        private int GetCurrentUserId()
        {
            // Try both claim types since JWT uses NameId but some systems expect NameIdentifier
            var userIdClaim =
                Context.User?.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        public async Task NotifyMessageDeleted(int messageId, int senderId, int recipientId)
        {
            try
            {
                // Notify both sender and recipient about message deletion
                var senderConnection = GetUserConnection(senderId);
                var recipientConnection = GetUserConnection(recipientId);

                if (senderConnection != null)
                {
                    await Clients.Client(senderConnection).SendAsync("MessageDeleted", messageId);
                }

                if (recipientConnection != null)
                {
                    await Clients
                        .Client(recipientConnection)
                        .SendAsync("MessageDeleted", messageId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error notifying message deletion for message {MessageId}",
                    messageId
                );
            }
        }
    }
}
