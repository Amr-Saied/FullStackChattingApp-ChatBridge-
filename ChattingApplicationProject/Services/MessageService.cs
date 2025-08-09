using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Models
{
    public class MessageService : IMessageService
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;

        public MessageService(DataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<ConversationDto>> GetConversations(int currentUserId)
        {
            var conversations = await _context
                .Messages.Where(m => m.SenderId == currentUserId || m.RecipientId == currentUserId)
                .Where(m => !m.SenderDeleted && !m.RecipientDeleted)
                .GroupBy(m => m.SenderId == currentUserId ? m.RecipientId : m.SenderId)
                .Select(g => new
                {
                    OtherUserId = g.Key,
                    LastMessage = g.OrderByDescending(m => m.MessageSent).First(),
                    UnreadCount = g.Count(m => m.RecipientId == currentUserId && m.DateRead == null)
                })
                .ToListAsync();

            var result = new List<ConversationDto>();

            foreach (var conv in conversations)
            {
                var otherUser = await _context
                    .Users.Include(u => u.Photos)
                    .FirstOrDefaultAsync(u => u.Id == conv.OtherUserId);

                if (otherUser != null)
                {
                    // Get the main photo URL
                    var mainPhoto = otherUser.Photos?.FirstOrDefault(p => p.IsMain);

                    result.Add(
                        new ConversationDto
                        {
                            OtherUserId = conv.OtherUserId,
                            OtherUsername = otherUser.UserName,
                            OtherUserPhotoUrl = mainPhoto?.Url,
                            LastMessage = conv.LastMessage.Content,
                            LastMessageTime = conv.LastMessage.MessageSent,
                            UnreadCount = conv.UnreadCount
                        }
                    );
                }
            }

            return result.OrderByDescending(c => c.LastMessageTime).ToList();
        }

        public async Task<List<MessageDto>> GetMessages(int currentUserId, int otherUserId)
        {
            var messages = await _context
                .Messages.Where(m =>
                    (m.SenderId == currentUserId && m.RecipientId == otherUserId)
                    || (m.SenderId == otherUserId && m.RecipientId == currentUserId)
                )
                .Where(m => !m.SenderDeleted && !m.RecipientDeleted)
                .OrderBy(m => m.MessageSent)
                .ToListAsync();

            var result = new List<MessageDto>();

            foreach (var message in messages)
            {
                var sender = await _context
                    .Users.Include(u => u.Photos)
                    .FirstOrDefaultAsync(u => u.Id == message.SenderId);
                var recipient = await _context
                    .Users.Include(u => u.Photos)
                    .FirstOrDefaultAsync(u => u.Id == message.RecipientId);

                var messageDto = _mapper.Map<MessageDto>(message);
                messageDto.SenderUsername = sender?.UserName ?? "";
                messageDto.RecipientUsername = recipient?.UserName ?? "";

                // Get main photo URLs
                messageDto.SenderPhotoUrl = sender?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;
                messageDto.RecipientPhotoUrl = recipient
                    ?.Photos?.FirstOrDefault(p => p.IsMain)
                    ?.Url;

                result.Add(messageDto);
            }

            return result;
        }

        public async Task<MessageDto> SendMessage(
            int senderId,
            int recipientId,
            string content,
            string emoji
        )
        {
            var sender = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == senderId);
            var recipient = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == recipientId);

            if (sender == null || recipient == null)
                throw new ArgumentException("Invalid sender or recipient");

            var message = new Message
            {
                SenderId = senderId,
                SenderUsername = sender.UserName,
                RecipientId = recipientId,
                RecipientUsername = recipient.UserName,
                Content = content,
                Emoji = emoji,
                MessageSent = DateTime.UtcNow,
                SenderDeleted = false,
                RecipientDeleted = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var messageDto = _mapper.Map<MessageDto>(message);
            messageDto.SenderUsername = sender.UserName;
            messageDto.RecipientUsername = recipient.UserName;

            // Get main photo URLs
            messageDto.SenderPhotoUrl = sender?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;
            messageDto.RecipientPhotoUrl = recipient?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;

            return messageDto;
        }

        public async Task<MessageDto> SendVoiceMessage(
            int senderId,
            int recipientId,
            string voiceUrl,
            int duration
        )
        {
            var sender = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == senderId);
            var recipient = await _context
                .Users.Include(u => u.Photos)
                .FirstOrDefaultAsync(u => u.Id == recipientId);

            if (sender == null || recipient == null)
                throw new ArgumentException("Invalid sender or recipient");

            var message = new Message
            {
                SenderId = senderId,
                SenderUsername = sender.UserName,
                RecipientId = recipientId,
                RecipientUsername = recipient.UserName,
                Content = "🎤 Voice Message", // Default content for voice messages
                VoiceUrl = voiceUrl,
                VoiceDuration = duration,
                MessageType = "voice",
                MessageSent = DateTime.UtcNow,
                SenderDeleted = false,
                RecipientDeleted = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var messageDto = _mapper.Map<MessageDto>(message);
            messageDto.SenderUsername = sender.UserName;
            messageDto.RecipientUsername = recipient.UserName;

            // Get main photo URLs
            messageDto.SenderPhotoUrl = sender?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;
            messageDto.RecipientPhotoUrl = recipient?.Photos?.FirstOrDefault(p => p.IsMain)?.Url;

            return messageDto;
        }

        public async Task<bool> MarkAsRead(int messageId, int currentUserId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message == null || message.RecipientId != currentUserId)
                return false;

            message.DateRead = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMessage(int messageId, int currentUserId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message == null)
                return false;

            if (message.SenderId == currentUserId)
                message.SenderDeleted = true;
            else if (message.RecipientId == currentUserId)
                message.RecipientDeleted = true;
            else
                return false;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCount(int currentUserId)
        {
            return await _context.Messages.CountAsync(m =>
                m.RecipientId == currentUserId
                && m.DateRead == null
                && !m.SenderDeleted
                && !m.RecipientDeleted
            );
        }

        public async Task<MessageDto?> GetMessage(int messageId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message == null)
                return null;

            return _mapper.Map<MessageDto>(message);
        }
    }
}
