using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Hubs;
using ChattingApplicationProject.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ChattingApplicationProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IVoiceService _voiceService;
        private readonly IHubContext<MessageHub> _hubContext;

        public MessageController(
            IMessageService messageService,
            IVoiceService voiceService,
            IHubContext<MessageHub> hubContext
        )
        {
            _messageService = messageService;
            _voiceService = voiceService;
            _hubContext = hubContext;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var conversations = await _messageService.GetConversations(currentUserId);
            return Ok(conversations);
        }

        [HttpGet("{otherUserId}")]
        public async Task<IActionResult> GetMessages(int otherUserId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var messages = await _messageService.GetMessages(currentUserId, otherUserId);
            return Ok(messages);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto messageDto)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(messageDto.Content))
                return BadRequest("Message content cannot be empty");

            try
            {
                var message = await _messageService.SendMessage(
                    currentUserId,
                    messageDto.RecipientId,
                    messageDto.Content,
                    messageDto.Emoji
                );

                // Notify ONLY the recipient via SignalR
                await _hubContext
                    .Clients.User(message.RecipientId.ToString())
                    .SendAsync(
                        "ReceiveMessage",
                        new
                        {
                            Id = message.Id,
                            SenderId = message.SenderId,
                            SenderUsername = message.SenderUsername,
                            SenderPhotoUrl = message.SenderPhotoUrl,
                            RecipientId = message.RecipientId,
                            RecipientUsername = message.RecipientUsername,
                            RecipientPhotoUrl = message.RecipientPhotoUrl,
                            Content = message.Content,
                            Emoji = message.Emoji,
                            MessageSent = message.MessageSent,
                            DateRead = message.DateRead
                        }
                    );

                return Ok(message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("voice")]
        public async Task<IActionResult> SendVoiceMessage(
            [FromForm] CreateVoiceMessageDto voiceMessageDto
        )
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            if (voiceMessageDto.VoiceFile == null || voiceMessageDto.VoiceFile.Length == 0)
                return BadRequest("Voice file is required");

            try
            {
                // Upload voice file to Cloudinary
                var voiceUrl = await _voiceService.UploadVoiceAsync(voiceMessageDto.VoiceFile);
                if (string.IsNullOrEmpty(voiceUrl))
                    return BadRequest("Failed to upload voice file");

                // Send voice message
                var message = await _messageService.SendVoiceMessage(
                    currentUserId,
                    voiceMessageDto.RecipientId,
                    voiceUrl,
                    voiceMessageDto.Duration
                );

                // Notify the recipient via SignalR
                await _hubContext
                    .Clients.User(message.RecipientId.ToString())
                    .SendAsync(
                        "ReceiveMessage",
                        new
                        {
                            Id = message.Id,
                            SenderId = message.SenderId,
                            SenderUsername = message.SenderUsername,
                            SenderPhotoUrl = message.SenderPhotoUrl,
                            RecipientId = message.RecipientId,
                            RecipientUsername = message.RecipientUsername,
                            RecipientPhotoUrl = message.RecipientPhotoUrl,
                            Content = message.Content,
                            VoiceUrl = message.VoiceUrl,
                            VoiceDuration = message.VoiceDuration,
                            MessageType = message.MessageType,
                            MessageSent = message.MessageSent,
                            DateRead = message.DateRead
                        }
                    );

                return Ok(message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing the voice message");
            }
        }

        [HttpPut("{messageId}/read")]
        public async Task<IActionResult> MarkAsRead(int messageId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var result = await _messageService.MarkAsRead(messageId, currentUserId);
            if (result)
            {
                // Notify ONLY the sender via SignalR that message was read
                var message = await _messageService.GetMessage(messageId);
                if (message != null)
                {
                    await _hubContext
                        .Clients.User(message.SenderId.ToString())
                        .SendAsync("MessageRead", messageId, currentUserId);
                }
                return Ok(new { success = true });
            }

            return BadRequest("Failed to mark message as read");
        }

        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            // Get message details before deletion for SignalR notification
            var messageToDelete = await _messageService.GetMessage(messageId);

            var result = await _messageService.DeleteMessage(messageId, currentUserId);
            if (result)
            {
                // Notify both the sender and recipient via SignalR that message was deleted
                if (messageToDelete != null)
                {
                    // Notify the other user (recipient or sender, depending on who deleted it)
                    var otherUserId =
                        messageToDelete.SenderId == currentUserId
                            ? messageToDelete.RecipientId
                            : messageToDelete.SenderId;

                    await _hubContext
                        .Clients.User(otherUserId.ToString())
                        .SendAsync("MessageDeleted", messageId);
                }

                return Ok(new { success = true });
            }

            return BadRequest("Failed to delete message");
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == 0)
                return Unauthorized();

            var count = await _messageService.GetUnreadCount(currentUserId);
            return Ok(new { unreadCount = count });
        }

        private int GetCurrentUserId()
        {
            // Try both claim types since JWT uses NameId but some systems expect NameIdentifier
            var userIdClaim =
                User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }
    }
}
