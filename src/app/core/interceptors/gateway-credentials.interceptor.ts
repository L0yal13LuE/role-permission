import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiModeService } from '../services/api-mode.service';

export const gatewayCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiMode = inject(ApiModeService);
  if (apiMode.isMock()) return next(req);

  const baseDomain = environment.apiBaseDomain;
  if (!baseDomain || !req.url.startsWith(baseDomain)) return next(req);

  return next(req.clone({ withCredentials: true }));
};
