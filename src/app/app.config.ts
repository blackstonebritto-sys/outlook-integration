import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MsalBroadcastService, MsalGuard, MsalInterceptor, MsalService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { createMsalInstance, createMsalInterceptorConfig, createMsalGuardConfig, initializeMsal } from './auth.config';
import { APP_INITIALIZER } from '@angular/core';
import { PublicClientApplication } from '@azure/msal-browser';
import { ImapService } from './imap.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: MSAL_INSTANCE, useFactory: createMsalInstance },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (instance: PublicClientApplication) => initializeMsal(instance),
      deps: [MSAL_INSTANCE],
    },
    { provide: MSAL_GUARD_CONFIG, useFactory: createMsalGuardConfig },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: createMsalInterceptorConfig },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    ImapService,
  ]
};
