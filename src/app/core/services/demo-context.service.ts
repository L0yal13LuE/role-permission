import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DemoAppRef {
  id: string; code: string; nameTH: string; nameEN: string; isActive: boolean;
}
export interface DemoContext {
  userId:        string;
  companyId:     string;
  companyNameTH: string;
  apps:          DemoAppRef[];
}

// Shapes matching actual API responses (after ApiResponse<T> envelope unwrap)

interface MeUser { id: string; displayName?: string; email: string; }
interface MeCompany { id: string; nameTH: string; nameEN?: string; isDefault: boolean; role: string; }
interface MeResponse { user: MeUser; companies: MeCompany[]; }

interface CompanyAppItem {
  applicationId: string;
  nameTH: string;
  nameEN: string;
  appCode: string | null;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class DemoContextService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  readonly ctx     = signal<DemoContext | null>(null);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  /** Lazy bootstrap — runs once, cached. */
  bootstrap(): Observable<DemoContext> {
    if (this.ctx()) return of(this.ctx()!);

    this.loading.set(true);
    this.error.set(null);

    // 1. GET /users/me → { user: { id, ... }, companies: [{ id, nameTH, ... }] }
    return this.http.get<MeResponse>(`${this.base}/users/me`).pipe(
      switchMap(me => {
        const userId       = me.user?.id ?? '';
        const firstCo      = me.companies?.[0];
        const companyId    = firstCo?.id    ?? '';
        const companyNameTH = firstCo?.nameTH ?? '';

        // 2. GET /companies/{companyId}/applications → CompanyApplicationDto[]
        return this.http
          .get<CompanyAppItem[]>(`${this.base}/companies/${companyId}/applications`)
          .pipe(
            map(companyApps => {
              const ctx: DemoContext = {
                userId,
                companyId,
                companyNameTH,
                apps: (companyApps ?? []).map(a => ({
                  id:       a.applicationId,
                  code:     a.appCode ?? '',
                  nameTH:   a.nameTH,
                  nameEN:   a.nameEN,
                  isActive: a.isActive,
                })),
              };
              return ctx;
            })
          );
      }),
      tap(ctx => {
        this.ctx.set(ctx);
        this.loading.set(false);
      }),
      catchError(err => {
        const msg = err?.status === 401
          ? 'ไม่ได้ล็อกอิน — กรุณา login ผ่านระบบ Exim ก่อน'
          : `API Error: ${err?.status}`;
        this.error.set(msg);
        this.loading.set(false);
        throw err;
      })
    );
  }

  appId(code: string): string {
    return this.ctx()?.apps.find(a => a.code?.toUpperCase() === code.toUpperCase())?.id ?? '';
  }
}
