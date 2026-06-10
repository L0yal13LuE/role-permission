import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { gatewayCredentialsInterceptor } from './core/interceptors/gateway-credentials.interceptor';
import { apiEnvelopeUnwrapInterceptor } from './core/interceptors/api-envelope-unwrap.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([gatewayCredentialsInterceptor, apiEnvelopeUnwrapInterceptor])),
    provideAnimations(),
  ],
};
