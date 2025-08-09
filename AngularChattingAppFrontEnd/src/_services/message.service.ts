import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ConversationDto } from '../_models/conversation';
import { MessageDto } from '../_models/message';
import { CreateMessageDto } from '../_models/create-message';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseUrl = environment.apiUrl + 'Message';

  constructor(private http: HttpClient, private stateService: StateService) {}

  // Get all conversations for current user
  getConversations(): Observable<ConversationDto[]> {
    return this.http
      .get<ConversationDto[]>(`${this.baseUrl}/conversations`)
      .pipe(
        map((conversations) =>
          conversations.map((conv) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
          }))
        ),
        tap((conversations) => {
          this.stateService.updateConversations(conversations);
        }),
        catchError(() => of([]))
      );
  }

  // Get messages between current user and specific user
  getMessages(otherUserId: number): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${this.baseUrl}/${otherUserId}`).pipe(
      map((messages) =>
        messages.map((msg) => ({
          ...msg,
          messageSent: new Date(msg.messageSent),
          dateRead: msg.dateRead ? new Date(msg.dateRead) : undefined,
        }))
      ),
      tap((messages) => {
        this.stateService.updateMessages(messages);
      }),
      catchError(() => of([]))
    );
  }

  sendMessage(
    recipientId: number,
    content: string,
    emoji?: string
  ): Observable<MessageDto> {
    const messageDto: any = {
      recipientId,
      content,
    };
    if (emoji && emoji.trim() !== '') {
      messageDto.emoji = emoji;
    }
    return this.http.post<MessageDto>(`${this.baseUrl}`, messageDto).pipe(
      tap((message) => {
        this.stateService.addMessage(message);
      })
    );
  }

  // Send voice message
  sendVoiceMessage(
    recipientId: number,
    voiceFile: File,
    duration: number
  ): Observable<MessageDto> {
    const formData = new FormData();
    formData.append('recipientId', recipientId.toString());
    formData.append('voiceFile', voiceFile);
    formData.append('duration', duration.toString());

    return this.http.post<MessageDto>(`${this.baseUrl}/voice`, formData).pipe(
      tap((message) => {
        this.stateService.addMessage(message);
      })
    );
  }
  // Mark message as read
  markAsRead(messageId: number): Observable<boolean> {
    return this.http
      .put<{ success: boolean }>(`${this.baseUrl}/${messageId}/read`, {})
      .pipe(
        map((response) => response.success),
        catchError(() => of(false))
      );
  }

  // Delete message
  deleteMessage(messageId: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean }>(`${this.baseUrl}/${messageId}`)
      .pipe(
        map((response) => response.success),
        tap((success) => {
          if (success) {
            this.stateService.removeMessage(messageId);
          }
        }),
        catchError(() => of(false))
      );
  }

  // Get unread message count
  getUnreadCount(): Observable<number> {
    return this.http
      .get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`)
      .pipe(
        map((response) => response.unreadCount),
        catchError(() => of(0))
      );
  }
}
