// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import 'zone.js';
import { tokenInterceptor } from './_interceptors/token-interceptor';
import { errorHandlerInterceptor } from './_interceptors/error-handler-interceptor';
import { loadingInterceptorInterceptor } from './_interceptors/loading-interceptor-interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpCache, withHttpCacheInterceptor } from '@ngneat/cashew';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withInterceptors([
        tokenInterceptor,
        errorHandlerInterceptor,
        loadingInterceptorInterceptor,
        withHttpCacheInterceptor(),
      ])
    ),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(NgxSpinnerModule),
    importProvidersFrom(BrowserAnimationsModule),
    provideHttpCache(),
  ],
});
