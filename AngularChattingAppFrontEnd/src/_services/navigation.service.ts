import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private previousPageSubject = new BehaviorSubject<string | null>(null);
  public previousPage$ = this.previousPageSubject.asObservable();

  // Track navigation history
  private navigationHistory: string[] = [];
  private readonly MAX_HISTORY = 5;

  constructor(private router: Router) {
    // Track navigation history
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.addToHistory(event.url);
      });
  }

  /**
   * Sets the previous page route before navigating to messages
   * @param route The route to return to when going back from messages
   */
  setPreviousPage(route: string): void {
    this.previousPageSubject.next(route);
  }

  /**
   * Gets the current previous page
   * @returns The previous page route or null
   */
  getPreviousPage(): string | null {
    return this.previousPageSubject.value;
  }

  /**
   * Navigates to messages with previous page tracking
   * @param queryParams Query parameters for the messages route
   * @param previousPage The page to return to when going back
   */
  navigateToMessagesWithHistory(queryParams: any, previousPage: string): void {
    this.setPreviousPage(previousPage);

    // Navigate to messages without replacing URL to maintain proper navigation history
    this.router
      .navigate(['/messages'], {
        queryParams,
      })
      .then(() => {
        // Navigation successful
      })
      .catch((error) => {
        console.error(
          'NavigationService: Error navigating to messages:',
          error
        );
      });
  }

  /**
   * Navigates back to the previous page or defaults to conversations
   */
  navigateBack(): void {
    const previousPage = this.getPreviousPage();

    if (previousPage) {
      // Clear the previous page after using it
      this.previousPageSubject.next(null);
      this.router.navigate([previousPage]);
    } else {
      // Default behavior - stay in messages but show conversations
      // This will be handled by the Messages component
      return;
    }
  }

  /**
   * Clears the previous page tracking
   */
  clearPreviousPage(): void {
    this.previousPageSubject.next(null);
  }

  /**
   * Adds a URL to navigation history
   */
  private addToHistory(url: string): void {
    // Remove query parameters for cleaner history
    const cleanUrl = url.split('?')[0];

    // Don't add if it's the same as the last entry
    if (
      this.navigationHistory.length === 0 ||
      this.navigationHistory[this.navigationHistory.length - 1] !== cleanUrl
    ) {
      this.navigationHistory.push(cleanUrl);

      // Keep only the last few entries
      if (this.navigationHistory.length > this.MAX_HISTORY) {
        this.navigationHistory.shift();
      }
    }
  }

  /**
   * Gets the page before the current one from navigation history
   */
  getPreviousPageFromHistory(): string | null {
    if (this.navigationHistory.length >= 2) {
      // Return the second-to-last page (the page before current)
      return this.navigationHistory[this.navigationHistory.length - 2];
    }
    return null;
  }

  /**
   * Gets navigation history for debugging
   */
  // getNavigationHistory(): string[] {
  //   return [...this.navigationHistory];
  // }
}
