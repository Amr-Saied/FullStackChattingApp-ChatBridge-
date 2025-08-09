import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveService } from '../_services/responsive.service';
import { ResponsiveDirective } from '../_directives/responsive.directive';

@Component({
  selector: 'app-responsive-wrapper',
  standalone: true,
  imports: [CommonModule, ResponsiveDirective],
  template: `
    <div
      class="responsive-wrapper"
      [class]="containerClass"
      appResponsive
      [responsiveClass]="baseClass"
      [mobileClass]="mobileClass"
      [tabletClass]="tabletClass"
      [desktopClass]="desktopClass"
      [largeDesktopClass]="largeDesktopClass"
      [responsivePadding]="responsivePadding"
      [mobilePadding]="mobilePadding"
      [tabletPadding]="tabletPadding"
      [desktopPadding]="desktopPadding"
      [largeDesktopPadding]="largeDesktopPadding"
      [responsiveMargin]="responsiveMargin"
      [mobileMargin]="mobileMargin"
      [tabletMargin]="tabletMargin"
      [desktopMargin]="desktopMargin"
      [largeDesktopMargin]="largeDesktopMargin"
      [responsiveFontSize]="responsiveFontSize"
      [mobileFontSize]="mobileFontSize"
      [tabletFontSize]="tabletFontSize"
      [desktopFontSize]="desktopFontSize"
      [largeDesktopFontSize]="largeDesktopFontSize"
    >
      <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
    </div>
  `,
  styles: [
    `
      .responsive-wrapper {
        transition: all 0.3s ease;
      }

      /* Mobile-first responsive behavior */
      .responsive-wrapper {
        width: 100%;
      }

      /* Tablet and up */
      @media (min-width: 768px) {
        .responsive-wrapper {
          max-width: 100%;
        }
      }

      /* Desktop and up */
      @media (min-width: 992px) {
        .responsive-wrapper {
          max-width: 100%;
        }
      }

      /* Large desktop and up */
      @media (min-width: 1200px) {
        .responsive-wrapper {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class ResponsiveWrapperComponent {
  @Input() containerClass: string = '';
  @Input() baseClass: string = '';
  @Input() mobileClass: string = '';
  @Input() tabletClass: string = '';
  @Input() desktopClass: string = '';
  @Input() largeDesktopClass: string = '';

  @Input() responsivePadding: string = '';
  @Input() mobilePadding: string = '';
  @Input() tabletPadding: string = '';
  @Input() desktopPadding: string = '';
  @Input() largeDesktopPadding: string = '';

  @Input() responsiveMargin: string = '';
  @Input() mobileMargin: string = '';
  @Input() tabletMargin: string = '';
  @Input() desktopMargin: string = '';
  @Input() largeDesktopMargin: string = '';

  @Input() responsiveFontSize: string = '';
  @Input() mobileFontSize: string = '';
  @Input() tabletFontSize: string = '';
  @Input() desktopFontSize: string = '';
  @Input() largeDesktopFontSize: string = '';

  @ContentChild(TemplateRef) contentTemplate!: TemplateRef<any>;

  constructor(private responsiveService: ResponsiveService) {}
}
