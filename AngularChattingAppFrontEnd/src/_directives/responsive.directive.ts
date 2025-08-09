import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { ResponsiveService } from '../_services/responsive.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appResponsive]',
  standalone: true,
})
export class ResponsiveDirective implements OnInit, OnDestroy {
  @Input() responsiveClass: string = '';
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

  private subscription: Subscription = new Subscription();

  constructor(
    private el: ElementRef,
    private responsiveService: ResponsiveService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.responsiveService.getResponsiveState().subscribe((state) => {
        this.updateElementClasses(state);
        this.updateElementStyles(state);
      })
    );
  }

  private updateElementClasses(state: any): void {
    const element = this.el.nativeElement;

    // Remove all responsive classes
    element.classList.remove(
      this.responsiveClass,
      this.mobileClass,
      this.tabletClass,
      this.desktopClass,
      this.largeDesktopClass
    );

    // Add appropriate class based on screen size
    if (state.isMobile && this.mobileClass) {
      element.classList.add(this.mobileClass);
    } else if (state.isTablet && this.tabletClass) {
      element.classList.add(this.tabletClass);
    } else if (state.isLargeDesktop && this.largeDesktopClass) {
      element.classList.add(this.largeDesktopClass);
    } else if (state.isDesktop && this.desktopClass) {
      element.classList.add(this.desktopClass);
    } else if (this.responsiveClass) {
      element.classList.add(this.responsiveClass);
    }
  }

  private updateElementStyles(state: any): void {
    const element = this.el.nativeElement;

    // Update padding
    if (state.isMobile && this.mobilePadding) {
      element.style.padding = this.mobilePadding;
    } else if (state.isTablet && this.tabletPadding) {
      element.style.padding = this.tabletPadding;
    } else if (state.isLargeDesktop && this.largeDesktopPadding) {
      element.style.padding = this.largeDesktopPadding;
    } else if (state.isDesktop && this.desktopPadding) {
      element.style.padding = this.desktopPadding;
    } else if (this.responsivePadding) {
      element.style.padding = this.responsivePadding;
    }

    // Update margin
    if (state.isMobile && this.mobileMargin) {
      element.style.margin = this.mobileMargin;
    } else if (state.isTablet && this.tabletMargin) {
      element.style.margin = this.tabletMargin;
    } else if (state.isLargeDesktop && this.largeDesktopMargin) {
      element.style.margin = this.largeDesktopMargin;
    } else if (state.isDesktop && this.desktopMargin) {
      element.style.margin = this.desktopMargin;
    } else if (this.responsiveMargin) {
      element.style.margin = this.responsiveMargin;
    }

    // Update font size
    if (state.isMobile && this.mobileFontSize) {
      element.style.fontSize = this.mobileFontSize;
    } else if (state.isTablet && this.tabletFontSize) {
      element.style.fontSize = this.tabletFontSize;
    } else if (state.isLargeDesktop && this.largeDesktopFontSize) {
      element.style.fontSize = this.largeDesktopFontSize;
    } else if (state.isDesktop && this.desktopFontSize) {
      element.style.fontSize = this.desktopFontSize;
    } else if (this.responsiveFontSize) {
      element.style.fontSize = this.responsiveFontSize;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
