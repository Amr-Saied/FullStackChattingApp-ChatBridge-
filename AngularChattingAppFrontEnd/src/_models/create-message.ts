export interface CreateMessageDto {
  recipientId: number;
  content: string;
  emoji?: string;
}
