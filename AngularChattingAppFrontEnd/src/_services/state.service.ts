import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Member } from '../_models/member';
import { ConversationDto } from '../_models/conversation';
import { MessageDto } from '../_models/message';

export interface AppState {
  currentUser: Member | null;
  members: Member[];
  conversations: ConversationDto[];
  messages: MessageDto[];
  likedUsers: Member[];
  isProfileUpdated: boolean;
  isMembersListUpdated: boolean;
  isConversationsUpdated: boolean;
  isMessagesUpdated: boolean;
  isLikedUsersUpdated: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private initialState: AppState = {
    currentUser: null,
    members: [],
    conversations: [],
    messages: [],
    likedUsers: [],
    isProfileUpdated: false,
    isMembersListUpdated: false,
    isConversationsUpdated: false,
    isMessagesUpdated: false,
    isLikedUsersUpdated: false,
  };

  private stateSubject = new BehaviorSubject<AppState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // Individual state observables for components
  public currentUser$ = new BehaviorSubject<Member | null>(null);
  public members$ = new BehaviorSubject<Member[]>([]);
  public conversations$ = new BehaviorSubject<ConversationDto[]>([]);
  public messages$ = new BehaviorSubject<MessageDto[]>([]);
  public likedUsers$ = new BehaviorSubject<Member[]>([]);

  // Update methods
  updateCurrentUser(user: Member | null): void {
    this.currentUser$.next(user);
    this.updateState({ currentUser: user, isProfileUpdated: true });
  }

  // Force refresh all user-related data
  forceRefreshUserData(user: Member): void {
    // Immediately update current user
    this.updateCurrentUser(user);

    // Update the user in the members list if it exists
    const currentMembers = this.members$.value;
    const updatedMembers = currentMembers.map((member) =>
      member.id === user.id ? user : member
    );
    this.updateMembers(updatedMembers);

    // Mark all related data as updated to trigger UI refreshes
    this.updateState({
      isProfileUpdated: true,
      isMembersListUpdated: true,
      isConversationsUpdated: true,
      isMessagesUpdated: true,
      isLikedUsersUpdated: true,
    });

    // Force change detection by emitting the same value again
    setTimeout(() => {
      this.currentUser$.next(user);
      this.members$.next(updatedMembers);
    }, 0);
  }

  updateMembers(members: Member[]): void {
    this.members$.next(members);
    this.updateState({ members, isMembersListUpdated: true });
  }

  updateConversations(conversations: ConversationDto[]): void {
    this.conversations$.next(conversations);
    this.updateState({ conversations, isConversationsUpdated: true });
  }

  updateMessages(messages: MessageDto[]): void {
    this.messages$.next(messages);
    this.updateState({ messages, isMessagesUpdated: true });
  }

  updateLikedUsers(likedUsers: Member[]): void {
    this.likedUsers$.next(likedUsers);
    this.updateState({ likedUsers, isLikedUsersUpdated: true });
  }

  // Add methods for optimistic updates
  addMember(member: Member): void {
    const currentMembers = this.members$.value;
    this.updateMembers([...currentMembers, member]);
  }

  updateMember(updatedMember: Member): void {
    const currentMembers = this.members$.value;
    const updatedMembers = currentMembers.map((member) =>
      member.id === updatedMember.id ? updatedMember : member
    );
    this.updateMembers(updatedMembers);
  }

  removeMember(memberId: number): void {
    const currentMembers = this.members$.value;
    const filteredMembers = currentMembers.filter(
      (member) => member.id !== memberId
    );
    this.updateMembers(filteredMembers);
  }

  addMessage(message: MessageDto): void {
    const currentMessages = this.messages$.value;
    this.updateMessages([...currentMessages, message]);
  }

  updateMessage(updatedMessage: MessageDto): void {
    const currentMessages = this.messages$.value;
    const updatedMessages = currentMessages.map((message) =>
      message.id === updatedMessage.id ? updatedMessage : message
    );
    this.updateMessages(updatedMessages);
  }

  removeMessage(messageId: number): void {
    const currentMessages = this.messages$.value;
    const filteredMessages = currentMessages.filter(
      (message) => message.id !== messageId
    );
    this.updateMessages(filteredMessages);
  }

  addConversation(conversation: ConversationDto): void {
    const currentConversations = this.conversations$.value;
    this.updateConversations([conversation, ...currentConversations]);
  }

  updateConversation(updatedConversation: ConversationDto): void {
    const currentConversations = this.conversations$.value;
    const updatedConversations = currentConversations.map((conversation) =>
      conversation.otherUserId === updatedConversation.otherUserId
        ? updatedConversation
        : conversation
    );
    this.updateConversations(updatedConversations);
  }

  // Reset update flags
  resetProfileUpdate(): void {
    this.updateState({ isProfileUpdated: false });
  }

  resetMembersListUpdate(): void {
    this.updateState({ isMembersListUpdated: false });
  }

  resetConversationsUpdate(): void {
    this.updateState({ isConversationsUpdated: false });
  }

  resetMessagesUpdate(): void {
    this.updateState({ isMessagesUpdated: false });
  }

  resetLikedUsersUpdate(): void {
    this.updateState({ isLikedUsersUpdated: false });
  }

  // Clear all state
  clearState(): void {
    this.stateSubject.next(this.initialState);
    this.currentUser$.next(null);
    this.members$.next([]);
    this.conversations$.next([]);
    this.messages$.next([]);
    this.likedUsers$.next([]);
  }

  private updateState(partialState: Partial<AppState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  // Get current state values
  getCurrentState(): AppState {
    return this.stateSubject.value;
  }

  getCurrentUser(): Member | null {
    return this.currentUser$.value;
  }

  getMembers(): Member[] {
    return this.members$.value;
  }

  getConversations(): ConversationDto[] {
    return this.conversations$.value;
  }

  getMessages(): MessageDto[] {
    return this.messages$.value;
  }

  getLikedUsers(): Member[] {
    return this.likedUsers$.value;
  }
}
