import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoDataService, ApiApp, ApiRole, ModeDto } from '../../../core/services/demo-data.service';

@Component({
  selector: 'app-mode-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sec-hd">
      <div>
        <div class="sh">Mode Role Configuration</div>
        <div class="ss">กำหนด role ที่อยู่ใน curated pool ของแต่ละ mode</div>
      </div>
    </div>

    @if (apiError()) {
      <div class="alert alert-red" style="margin-bottom:16px">⚠️ {{ apiError() }}</div>
    }

    <!-- App tabs -->
    <div class="tab-bar" style="margin-bottom:20px">
      @if (loadingApps()) {
        <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด apps...</span>
      }
      @for (app of apps(); track app.id) {
        <button class="tab-btn" [class.active]="selectedAppId() === app.id" (click)="selectApp(app.id)">
          {{ app.appCode?.toUpperCase() ?? app.appName }}
        </button>
      }
    </div>

    @if (selectedAppId()) {
      @if (loadingRoles()) {
        <div style="color:#64748B;font-size:13px">⏳ กำลังโหลด roles...</div>
      } @else if (roles().length === 0) {
        <div style="color:#94A3B8;font-size:13px">ไม่มี role ใน app นี้</div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  @for (m of allModes(); track m.id) {
                    <th style="text-align:center;min-width:130px">
                      <span class="badge b-single">{{ m.name }}</span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (role of roles(); track role.id) {
                  <tr>
                    <td>
                      <span style="font-weight:600;font-size:13px">{{ role.name }}</span>
                      @if (!role.isActive) {
                        <span class="badge b-inactive" style="margin-left:6px;font-size:10px">Inactive</span>
                      }
                    </td>
                    @for (m of allModes(); track m.id) {
                      <td style="text-align:center">
                        @if (isSaving(role.id, m.code)) {
                          <span style="font-size:12px;color:#64748B">⏳</span>
                        } @else {
                          <div class="toggle-wrap" (click)="toggleMode(role, m)" style="justify-content:center">
                            <div class="toggle-track" [class.on]="hasMode(role, m)">
                              <div class="toggle-thumb"></div>
                            </div>
                          </div>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    } @else if (!loadingApps()) {
      <div style="color:#94A3B8;font-size:13px">เลือก app เพื่อจัดการ modes</div>
    }
  `,
  styles: [`
    .tab-bar { display: flex; gap: 8px; flex-wrap: wrap; }
    .tab-btn {
      padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600;
      border: 1px solid #E2E8F0; background: #fff; cursor: pointer; color: #475569;
      transition: all .15s;
      &:hover { border-color: #034EA1; color: #034EA1; }
      &.active { background: #034EA1; color: #fff; border-color: #034EA1; }
    }
  `],
})
export class ModeConfigComponent implements OnInit {
  protected apiMode    = inject(ApiModeService);
  private dataApi      = inject(DemoDataService);

  readonly allModes = signal<ModeDto[]>([]);

  apps          = signal<ApiApp[]>([]);
  selectedAppId = signal<string | null>(null);
  roles         = signal<ApiRole[]>([]);
  loadingApps   = signal(false);
  loadingRoles  = signal(false);
  apiError      = signal<string | null>(null);

  private savingSet = signal<Set<string>>(new Set());

  isSaving(roleId: string, modeCode: string): boolean {
    return this.savingSet().has(`${roleId}:${modeCode}`);
  }

  hasMode(role: ApiRole, mode: ModeDto): boolean {
    return (role.modes ?? []).includes(mode.code);
  }

  ngOnInit() {
    if (this.apiMode.isReal()) {
      this.loadModes();
      this.loadApps();
    }
  }

  private loadModes() {
    this.dataApi.getModes().subscribe({
      next: modes => this.allModes.set(modes),
      error: err => this.apiError.set(`Load modes error: ${err?.status}`),
    });
  }

  private loadApps() {
    this.loadingApps.set(true);
    this.dataApi.getApps().subscribe({
      next: apps => {
        this.apps.set(apps);
        this.loadingApps.set(false);
        if (apps.length > 0) this.selectApp(apps[0].id);
      },
      error: err => {
        this.apiError.set(`Load apps error: ${err?.status}`);
        this.loadingApps.set(false);
      },
    });
  }

  selectApp(appId: string) {
    this.selectedAppId.set(appId);
    this.loadingRoles.set(true);
    this.apiError.set(null);
    this.dataApi.getRoles(appId).subscribe({
      next: roles => {
        this.roles.set(roles);
        this.loadingRoles.set(false);
      },
      error: err => {
        this.apiError.set(`Load roles error: ${err?.status}`);
        this.loadingRoles.set(false);
      },
    });
  }

  toggleMode(role: ApiRole, mode: ModeDto) {
    const appId = this.selectedAppId();
    if (!appId) return;

    const key = `${role.id}:${mode.code}`;
    this.savingSet.update(s => new Set(s).add(key));

    const already = this.hasMode(role, mode);
    const call: Observable<unknown> = already
      ? this.dataApi.removeRoleMode(appId, role.id, mode.code)
      : this.dataApi.assignRoleMode(appId, role.id, mode.code);

    call.subscribe({
      next: () => {
        this.roles.update(list => list.map(r => {
          if (r.id !== role.id) return r;
          const modes = already
            ? (r.modes ?? []).filter(m => m !== mode.code)
            : [...(r.modes ?? []), mode.code];
          return { ...r, modes };
        }));
        this.savingSet.update(s => { const n = new Set(s); n.delete(key); return n; });
      },
      error: err => {
        this.apiError.set(`Save failed: ${err?.status}`);
        this.savingSet.update(s => { const n = new Set(s); n.delete(key); return n; });
      },
    });
  }
}
