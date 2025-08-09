import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appDragDrop]',
  standalone: true,
})
export class DragDropDirective {
  @Output() filesDropped = new EventEmitter<FileList>();
  @Output() dragEnter = new EventEmitter<boolean>();
  @Output() dragLeave = new EventEmitter<boolean>();

  @Input() acceptedFileTypes: string = 'image/*';

  @HostBinding('class.drag-over') isDragOver = false;

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
    this.dragEnter.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    this.dragLeave.emit(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    this.dragLeave.emit(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Filter files by accepted types
      const filteredFiles = Array.from(files).filter((file) => {
        if (this.acceptedFileTypes === 'image/*') {
          return file.type.startsWith('image/');
        }
        return true;
      });

      if (filteredFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        filteredFiles.forEach((file) => dataTransfer.items.add(file));
        this.filesDropped.emit(dataTransfer.files);
      }
    }
  }
}
