export interface ConversationDto {
  otherUserId: number;
  otherUsername: string;
  otherUserPhotoUrl?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}
