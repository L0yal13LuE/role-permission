import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiModeService } from '../services/api-mode.service';
import { environment } from '../../../environments/environment';

/**
 * Unwraps ApiResponse<T> { data, meta } envelope from SupApp_util_lib.
 * Applied only to real-mode calls to the Exim gateway.
 */
export const apiEnvelopeUnwrapInterceptor: HttpInterceptorFn = (req, next) => {
  const apiMode = inject(ApiModeService);
  if (apiMode.isMock()) return next(req);

  const baseDomain = environment.apiBaseDomain;
  if (baseDomain && !req.url.startsWith(baseDomain)) return next(req);

  return next(req).pipe(
    map(event => {
      if (
        event instanceof HttpResponse &&
        event.body !== null &&
        typeof event.body === 'object' &&
        'data' in event.body
      ) {
        return event.clone({ body: (event.body as { data: unknown }).data });
      }
      return event;
    })
  );
};
