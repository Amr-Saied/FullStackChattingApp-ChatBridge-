import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { MessageDto } from '../_models/message';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private onlineUsers = new BehaviorSubject<number[]>([]);

  // Message handling
  private messageCallbacks: ((message: MessageDto) => void)[] = [];

  // Notification management
  private lastNotificationTime = new Map<number, number>(); // userId -> timestamp
  private readonly NOTIFICATION_COOLDOWN = 3 * 60 * 1000; // 3 minutes
  private currentChatUserId: number | null = null;

  constructor(private toastr: ToastrService, private router: Router) {}

  startConnection(token: string): Promise<void> {
    // If already connected, return resolved promise
    if (this.hubConnection && this.connectionEstablished.value) {
      return Promise.resolve();
    }

    // If connection exists but not connected, stop it first
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }

    // Add a small delay to ensure previous connection is fully stopped
    return new Promise((resolve) => {
      setTimeout(() => {
        this.hubConnection = new HubConnectionBuilder()
          .withUrl(`${environment.apiUrl}messagehub`, {
            accessTokenFactory: () => token,
          })
          .withAutomaticReconnect([0, 2000, 10000, 30000])
          .configureLogging(0) // Disable SignalR logging
          .build();

        // Add connection event handlers
        this.hubConnection!.onreconnecting(() => {
          this.connectionEstablished.next(false);
        });

        this.hubConnection!.onreconnected(() => {
          this.connectionEstablished.next(true);
          this.setupEventHandlers();
        });

        this.hubConnection!.onclose(() => {
          this.connectionEstablished.next(false);
        });

        this.hubConnection!.start()
          .then(() => {
            this.connectionEstablished.next(true);
            this.setupEventHandlers();
            resolve();
          })
          .catch((error) => {
            // Silent error handling for production
            this.connectionEstablished.next(false);
            resolve(); // Always resolve to prevent hanging
          });
      }, 100); // Small delay to ensure clean connection
    });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionEstablished.next(false);
    }
  }

  get connectionState(): string {
    if (!this.hubConnection) return 'No Connection';
    return this.hubConnection.state;
  }

  // Send typing indicator
  sendTyping(recipientId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('Typing', recipientId);
    }
  }

  // Send stop typing indicator
  sendStopTyping(recipientId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('StopTyping', recipientId);
    }
  }

  // Mark message as read via SignalR
  markAsRead(messageId: number, senderId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('MarkAsRead', messageId, senderId);
    }
  }

  // Join user group
  joinUserGroup(userId: number): void {
    if (this.hubConnection && this.connectionEstablished.value) {
      this.hubConnection.invoke('JoinUserGroup', userId);
    }
  }

  // Get connection status
  getConnectionStatus(): Observable<boolean> {
    return this.connectionEstablished.asObservable();
  }

  // Get online users
  getOnlineUsers(): Observable<number[]> {
    return this.onlineUsers.asObservable();
  }

  // Check if user is online
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.value.includes(userId);
  }

  // Set current chat user (to prevent notifications from active chat)
  setCurrentChatUser(userId: number | null): void {
    this.currentChatUserId = userId;
  }

  // Simplified event handlers for component usage
  onReceiveMessage(callback: (message: MessageDto) => void): void {
    this.messageCallbacks.push(callback);
  }

  // Remove a specific callback (for component cleanup)
  removeReceiveMessageCallback(callback: (message: MessageDto) => void): void {
    const index = this.messageCallbacks.indexOf(callback);
    if (index > -1) {
      this.messageCallbacks.splice(index, 1);
    }
  }

  // Clear all callbacks (for testing/cleanup)
  clearAllCallbacks(): void {
    this.messageCallbacks = [];
  }

  onMessageRead(callback: (messageId: number, userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on(
        'MessageRead',
        (messageId: number, userId: number) => {
          callback(messageId, userId);
        }
      );
    }
  }

  onMessageDeleted(callback: (messageId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('MessageDeleted', callback);
    }
  }

  onUserTyping(callback: (userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserTyping', callback);
    }
  }

  onUserStoppedTyping(callback: (userId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserStoppedTyping', callback);
    }
  }

  // Notification Management Methods
  private checkAndShowNotification(message: any): void {
    const senderId = message.senderId || message.SenderId;
    const senderName =
      message.senderUsername ||
      message.SenderUsername ||
      message.senderName ||
      message.SenderName ||
      `User ${senderId}`;
    const content = message.content || message.Content;
    const now = Date.now();

    // Don't notify if user is viewing this chat
    if (this.currentChatUserId === senderId) {
      return;
    }

    // Check cooldown
    const lastNotification = this.lastNotificationTime.get(senderId) || 0;
    if (now - lastNotification < this.NOTIFICATION_COOLDOWN) {
      return;
    }

    // Show notification
    this.showMessageNotification(senderName, content, senderId);

    // Update last notification time
    this.lastNotificationTime.set(senderId, now);
  }

  private showMessageNotification(
    senderName: string,
    content: string,
    senderId: number
  ): void {
    try {
      const toastRef = this.toastr.info(
        `${senderName} sent you a new message`,
        `New Message`,
        {
          timeOut: 8000, // Extended from 5000
          closeButton: true,
          progressBar: true,
          tapToDismiss: true,
          positionClass: 'toast-bottom-right',
          enableHtml: false,
        }
      );

      // Add click handler to navigate to chat
      if (toastRef && toastRef.onTap) {
        toastRef.onTap.subscribe(() => {
          this.router.navigate(['/messages'], {
            queryParams: { userId: senderId, username: senderName },
          });
        });
      }
    } catch (error) {
      // Silent error handling for production
    }
  }

  // Setup event handlers (called once when connection starts)
  private setupEventHandlers(): void {
    if (!this.hubConnection) {
      return;
    }

    // Remove any existing handlers first to prevent duplicates (but NOT ReceiveMessage)
    this.hubConnection.off('UserOnline');
    this.hubConnection.off('UserOffline');
    this.hubConnection.off('OnlineUsersUpdate');

    // Global message handler that forwards to all registered callbacks AND handles notifications
    this.hubConnection.off('ReceiveMessage'); // Remove only to set up the new comprehensive handler
    this.hubConnection.on('ReceiveMessage', (message: any) => {
      // Forward message to all registered component callbacks
      this.messageCallbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          // Silent error handling for production
        }
      });

      // Handle notifications
      this.checkAndShowNotification(message);
    });

    // Online status handlers
    this.hubConnection.on('UserOnline', (userId: number) => {
      const currentOnline = this.onlineUsers.value;
      if (!currentOnline.includes(userId)) {
        this.onlineUsers.next([...currentOnline, userId]);
      }
    });

    this.hubConnection.on('UserOffline', (userId: number) => {
      const currentOnline = this.onlineUsers.value;
      this.onlineUsers.next(currentOnline.filter((id) => id !== userId));
    });

    this.hubConnection.on('OnlineUsersUpdate', (userIds: number[]) => {
      this.onlineUsers.next(userIds);
    });
  }

  // Ban notification handlers
  onUserBanned(
    callback: (userId: number, message: string, isPermanent: boolean) => void
  ): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserBanned', callback);
    }
  }

  onUserUnbanned(callback: () => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('UserUnbanned', callback);
    }
  }

  // Clear ban notification listeners to prevent duplicates
  clearBanListeners(): void {
    if (this.hubConnection) {
      this.hubConnection.off('UserBanned');
      this.hubConnection.off('UserUnbanned');
    }
  }
}
