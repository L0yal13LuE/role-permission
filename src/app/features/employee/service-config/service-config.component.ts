import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoDataService, ApiMode } from '../../../core/services/demo-data.service';

interface ServiceConfig {
  id: string; icon: string; name: string; code: string;
  enabled: boolean; singleMode: boolean; multipleMode: boolean;
  originalEnabled: boolean;
  modeSaving: boolean;
}

const ICON_MAP: Record<string, string> = { FX: '💱', TBP: '🏦', ECI: '🛡️' };

@Component({
  selector: 'app-service-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Service Configuration</div>
          <div class="ss">กำหนดค่า service ที่ให้บริการและรูปแบบอนุมัติที่รองรับ</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          @if (loading()) { <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span> }
          @if (apiError()) { <span class="badge b-red">⚠️ {{ apiError() }}</span> }
          <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
            {{ saving() ? '⏳...' : '💾 บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    @if (saved()) {
      <div class="alert alert-green" style="margin-bottom:16px">✅ บันทึกการตั้งค่าเรียบร้อยแล้ว</div>
    }

    <div class="g3">
      @for (svc of services(); track svc.id) {
        <div class="card">
          <div class="card-hd">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:22px">{{ svc.icon }}</span>
              <div>
                <div class="card-title">{{ svc.name }}</div>
                <div class="card-sub mono">{{ svc.code }}</div>
              </div>
            </div>
            <div class="toggle-wrap" (click)="toggleEnabled(svc)">
              <div class="toggle-track" [class.on]="svc.enabled">
                <div class="toggle-thumb"></div>
              </div>
              <span class="badge" [class]="svc.enabled ? 'b-active' : 'b-inactive'">
                {{ svc.enabled ? 'เปิด' : 'ปิด' }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="form-label" style="margin-bottom:10px">รูปแบบอนุมัติที่รองรับ</div>

            <label class="check-row" [class.disabled]="!svc.enabled || svc.modeSaving">
              <input type="checkbox" [checked]="svc.singleMode"
                     [disabled]="!svc.enabled || svc.modeSaving"
                     (change)="toggleMode(svc, 'SingleUser', 'singleMode')">
              <div>
                <div style="font-weight:600;font-size:12.5px">Single User</div>
                <div style="font-size:11.5px;color:#64748B">1 คนทำรายการและอนุมัติเอง</div>
              </div>
            </label>

            <label class="check-row" [class.disabled]="!svc.enabled || svc.modeSaving">
              <input type="checkbox" [checked]="svc.multipleMode"
                     [disabled]="!svc.enabled || svc.modeSaving"
                     (change)="toggleMode(svc, 'MultipleUser', 'multipleMode')">
              <div>
                <div style="font-weight:600;font-size:12.5px">Multiple User</div>
                <div style="font-size:11.5px;color:#64748B">มี workflow Maker → Approver</div>
              </div>
            </label>

            @if (svc.enabled && svc.multipleMode) {
              <div class="badge b-multiple" style="margin-top:8px;font-size:10.5px">
                Workflow: Requester → Maker → Approver
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .check-row {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px;
      border: 1px solid #E2E8F0; border-radius: 8px; cursor: pointer;
      margin-bottom: 8px; transition: border-color .15s;
      &:hover { border-color: #034EA1; background: #EBF2FC; }
      &.disabled { opacity: .5; cursor: not-allowed; &:hover { border-color: #E2E8F0; background: #fff; } }
      input[type=checkbox] { margin-top: 2px; accent-color: #034EA1; width: 15px; height: 15px; flex-shrink: 0; }
    }
  `],
})
export class ServiceConfigComponent implements OnInit {
  readonly apiMode = inject(ApiModeService);
  private dataApi  = inject(DemoDataService);

  loading  = signal(false);
  saving   = signal(false);
  saved    = signal(false);
  apiError = signal<string | null>(null);

  services = signal<ServiceConfig[]>([
    { id: 'fx',  icon: '💱', name: 'FX Forward Contract', code: 'FX',  enabled: true,  singleMode: true,  multipleMode: true,  originalEnabled: true,  modeSaving: false },
    { id: 'tbp', icon: '🏦', name: 'TBP สินเชื่อ',        code: 'TBP', enabled: true,  singleMode: true,  multipleMode: true,  originalEnabled: true,  modeSaving: false },
    { id: 'eci', icon: '🛡️', name: 'ECI ประกันการส่งออก', code: 'ECI', enabled: false, singleMode: false, multipleMode: false, originalEnabled: false, modeSaving: false },
  ]);

  ngOnInit() {
    if (this.apiMode.isReal()) this.loadReal();
  }

  private loadReal() {
    this.loading.set(true);
    this.apiError.set(null);

    this.dataApi.getApps().subscribe({
      next: apps => {
        if (apps.length === 0) {
          this.services.set([]);
          this.loading.set(false);
          return;
        }
        const modesCalls = Object.fromEntries(apps.map(a => [a.id, this.dataApi.getAppModes(a.id)]));
        forkJoin(modesCalls).subscribe({
          next: modesMap => {
            this.services.set(apps.map(a => {
              const modes: ApiMode[] = (modesMap as Record<string, ApiMode[]>)[a.id] ?? [];
              return {
                id:              a.id,
                icon:            ICON_MAP[a.appCode?.toUpperCase() ?? ''] ?? '📦',
                name:            a.nameTH || a.nameEN || a.appCode || a.id,
                code:            a.appCode?.toUpperCase() ?? a.id.slice(0, 6),
                enabled:         a.isActive,
                originalEnabled: a.isActive,
                singleMode:      modes.find(m => m.mode === 'SingleUser')?.isActive ?? false,
                multipleMode:    modes.find(m => m.mode === 'MultipleUser')?.isActive ?? false,
                modeSaving:      false,
              };
            }));
            this.loading.set(false);
          },
          error: err => {
            this.apiError.set(`Error ${err?.status}`);
            this.loading.set(false);
          },
        });
      },
      error: err => {
        this.apiError.set(`Error ${err?.status}`);
        this.loading.set(false);
      },
    });
  }

  toggleEnabled(svc: ServiceConfig) {
    this.services.update(list =>
      list.map(s => s.id === svc.id ? { ...s, enabled: !s.enabled } : s)
    );
  }

  toggleMode(svc: ServiceConfig, mode: 'SingleUser' | 'MultipleUser', field: 'singleMode' | 'multipleMode') {
    const newValue = !svc[field];

    if (!this.apiMode.isReal()) {
      this.services.update(list =>
        list.map(s => s.id === svc.id ? { ...s, [field]: newValue } : s)
      );
      return;
    }

    this.services.update(list =>
      list.map(s => s.id === svc.id ? { ...s, modeSaving: true } : s)
    );

    this.dataApi.setAppMode(svc.id, mode, newValue).subscribe({
      next: () => {
        this.services.update(list =>
          list.map(s => s.id === svc.id ? { ...s, [field]: newValue, modeSaving: false } : s)
        );
      },
      error: err => {
        this.apiError.set(`Mode save failed: ${err?.status}`);
        this.services.update(list =>
          list.map(s => s.id === svc.id ? { ...s, modeSaving: false } : s)
        );
      },
    });
  }

  save() {
    if (!this.apiMode.isReal()) {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
      return;
    }

    const changed = this.services().filter(s => s.enabled !== s.originalEnabled);
    if (changed.length === 0) {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
      return;
    }

    this.saving.set(true);
    let remaining = changed.length;
    let hasError = false;

    for (const svc of changed) {
      this.dataApi.updateApp(svc.id, svc.enabled).subscribe({
        next: () => {
          this.services.update(list =>
            list.map(s => s.id === svc.id ? { ...s, originalEnabled: s.enabled } : s)
          );
          remaining--;
          if (remaining === 0 && !hasError) {
            this.saving.set(false);
            this.saved.set(true);
            setTimeout(() => this.saved.set(false), 2500);
          }
        },
        error: err => {
          hasError = true;
          this.apiError.set(`Save failed: ${err?.status}`);
          this.saving.set(false);
        },
      });
    }
  }
}
