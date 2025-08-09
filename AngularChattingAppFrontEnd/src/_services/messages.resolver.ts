import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { MessageService } from './message.service';
import { LikesService } from './likes.service';
import { ConversationDto } from '../_models/conversation';
import { Member } from '../_models/member';

export interface MessagesResolverData {
  conversations: ConversationDto[];
  likedUsers: Member[];
  hasConversations: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MessagesResolver implements Resolve<MessagesResolverData> {
  constructor(
    private messageService: MessageService,
    private likesService: LikesService
  ) {}

  resolve(): Observable<MessagesResolverData> {
    // Load both conversations and liked users in parallel for better performance
    return forkJoin({
      conversations: this.messageService.getConversations().pipe(
        catchError((error) => {
          console.error(
            'MessagesResolver: Error loading conversations:',
            error
          );
          return of([]);
        })
      ),
      likedUsers: this.likesService.getMyLikes().pipe(
        catchError((error) => {
          console.error('MessagesResolver: Error loading liked users:', error);
          return of([]);
        })
      ),
    }).pipe(
      map(({ conversations, likedUsers }) => {
        return {
          conversations,
          likedUsers,
          hasConversations: conversations.length > 0,
        };
      }),
      catchError((error) => {
        console.error('MessagesResolver: Error resolving data:', error);
        return of({
          conversations: [],
          likedUsers: [],
          hasConversations: false,
        });
      })
    );
  }
}
