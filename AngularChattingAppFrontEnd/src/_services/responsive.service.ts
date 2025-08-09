import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface ResponsiveBreakpoints {
  xs: number; // Extra small devices (phones, 576px and down)
  sm: number; // Small devices (landscape phones, 576px and up)
  md: number; // Medium devices (tablets, 768px and up)
  lg: number; // Large devices (desktops, 992px and up)
  xl: number; // Extra large devices (large desktops, 1200px and up)
  xxl: number; // Extra extra large devices (larger desktops, 1400px and up)
}

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: string;
  orientation: 'portrait' | 'landscape';
}

@Injectable({
  providedIn: 'root',
})
export class ResponsiveService implements OnDestroy {
  private breakpoints: ResponsiveBreakpoints = {
    xs: 576,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  };

  private responsiveState$ = new BehaviorSubject<ResponsiveState>(
    this.getInitialState()
  );

  constructor() {
    this.initializeResponsiveDetection();
  }

  private getInitialState(): ResponsiveState {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < this.breakpoints.md,
      isTablet: width >= this.breakpoints.md && width < this.breakpoints.lg,
      isDesktop: width >= this.breakpoints.lg && width < this.breakpoints.xl,
      isLargeDesktop: width >= this.breakpoints.xl,
      currentBreakpoint: this.getCurrentBreakpoint(width),
      orientation: height > width ? 'portrait' : 'landscape',
    };
  }

  private getCurrentBreakpoint(width: number): string {
    if (width < this.breakpoints.sm) return 'xs';
    if (width < this.breakpoints.md) return 'sm';
    if (width < this.breakpoints.lg) return 'md';
    if (width < this.breakpoints.xl) return 'lg';
    if (width < this.breakpoints.xxl) return 'xl';
    return 'xxl';
  }

  private initializeResponsiveDetection(): void {
    // Create resize and orientation change observables
    const resize$ = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      map(() => this.getCurrentState())
    );

    const orientationChange$ = fromEvent(window, 'orientationchange').pipe(
      debounceTime(100),
      map(() => this.getCurrentState())
    );

    // Merge and subscribe to changes
    merge(resize$, orientationChange$)
      .pipe(
        distinctUntilChanged(
          (prev, curr) =>
            prev.currentBreakpoint === curr.currentBreakpoint &&
            prev.orientation === curr.orientation
        )
      )
      .subscribe((state) => {
        this.responsiveState$.next(state);
      });
  }

  private getCurrentState(): ResponsiveState {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < this.breakpoints.md,
      isTablet: width >= this.breakpoints.md && width < this.breakpoints.lg,
      isDesktop: width >= this.breakpoints.lg && width < this.breakpoints.xl,
      isLargeDesktop: width >= this.breakpoints.xl,
      currentBreakpoint: this.getCurrentBreakpoint(width),
      orientation: height > width ? 'portrait' : 'landscape',
    };
  }

  // Public methods
  getResponsiveState(): Observable<ResponsiveState> {
    return this.responsiveState$.asObservable();
  }

  getCurrentResponsiveState(): ResponsiveState {
    return this.responsiveState$.value;
  }

  isMobile(): boolean {
    return this.responsiveState$.value.isMobile;
  }

  isTablet(): boolean {
    return this.responsiveState$.value.isTablet;
  }

  isDesktop(): boolean {
    return this.responsiveState$.value.isDesktop;
  }

  isLargeDesktop(): boolean {
    return this.responsiveState$.value.isLargeDesktop;
  }

  getOrientation(): 'portrait' | 'landscape' {
    return this.responsiveState$.value.orientation;
  }

  // Utility methods for responsive design
  getResponsiveClass(
    baseClass: string,
    mobileClass?: string,
    tabletClass?: string,
    desktopClass?: string
  ): string {
    const state = this.responsiveState$.value;

    if (state.isMobile && mobileClass) return mobileClass;
    if (state.isTablet && tabletClass) return tabletClass;
    if (state.isDesktop && desktopClass) return desktopClass;

    return baseClass;
  }

  getResponsiveValue<T>(
    mobileValue: T,
    tabletValue: T,
    desktopValue: T,
    largeDesktopValue?: T
  ): T {
    const state = this.responsiveState$.value;

    if (state.isMobile) return mobileValue;
    if (state.isTablet) return tabletValue;
    if (state.isLargeDesktop && largeDesktopValue !== undefined)
      return largeDesktopValue;

    return desktopValue;
  }

  ngOnDestroy(): void {
    this.responsiveState$.complete();
  }
}
