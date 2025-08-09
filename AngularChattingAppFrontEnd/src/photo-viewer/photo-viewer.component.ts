import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoDTO } from '../_models/member';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="photo-viewer-overlay" *ngIf="isOpen" (click)="closeViewer()">
      <div class="photo-viewer-container" (click)="$event.stopPropagation()">
        <!-- Close Button -->
        <button class="close-btn" (click)="closeViewer()">
          <i class="fas fa-times"></i>
        </button>

        <!-- Photo Container -->
        <div class="photo-container">
          <!-- Navigation Buttons -->
          <button
            class="nav-btn prev-btn"
            *ngIf="photos.length > 1"
            (click)="previousPhoto()"
            [disabled]="currentIndex === 0"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <button
            class="nav-btn next-btn"
            *ngIf="photos.length > 1"
            (click)="nextPhoto()"
            [disabled]="currentIndex === photos.length - 1"
          >
            <i class="fas fa-chevron-right"></i>
          </button>

          <img
            [src]="currentPhoto?.url"
            [alt]="'Photo ' + (currentIndex + 1)"
            class="viewer-photo"
            (load)="onImageLoad()"
            (error)="onImageError()"
          />

          <!-- Loading Spinner -->
          <div class="loading-spinner" *ngIf="imageLoading">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
        </div>

        <!-- Photo Info -->
        <div class="photo-info" *ngIf="photos.length > 1">
          <span>{{ currentIndex + 1 }} of {{ photos.length }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./photo-viewer.component.css'],
})
export class PhotoViewerComponent {
  @Input() isOpen: boolean = false;
  @Input() photos: PhotoDTO[] = [];
  @Input() currentIndex: number = 0;
  @Output() closed = new EventEmitter<void>();

  imageLoading: boolean = false;

  get currentPhoto(): PhotoDTO | undefined {
    return this.photos[this.currentIndex];
  }

  closeViewer() {
    this.isOpen = false;
    this.closed.emit();
  }

  previousPhoto() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.imageLoading = true;
    }
  }

  nextPhoto() {
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
      this.imageLoading = true;
    }
  }

  onImageLoad() {
    this.imageLoading = false;
  }

  onImageError() {
    this.imageLoading = false;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        this.closeViewer();
        break;
      case 'ArrowLeft':
        this.previousPhoto();
        break;
      case 'ArrowRight':
        this.nextPhoto();
        break;
    }
  }
}
