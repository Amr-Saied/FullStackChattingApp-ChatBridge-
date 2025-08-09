export interface MessageDto {
  id: number;
  senderId: number;
  senderUsername: string;
  senderPhotoUrl?: string;
  recipientId: number;
  recipientUsername: string;
  recipientPhotoUrl?: string;
  content: string;
  emoji?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  messageType?: string;
  messageSent: Date;
  dateRead?: Date;
}
