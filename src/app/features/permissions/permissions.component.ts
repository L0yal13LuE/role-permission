import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { Permission, Application, CreatePermissionRequest } from '../../core/models';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Permissions</div>
          <div class="ss">จัดการ Permission ในรูปแบบ resource:action ต่อแต่ละ Application</div>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ เพิ่ม Permission</button>
      </div>
    </div>

    <!-- App Selector -->
    <div style="margin-bottom:16px">
      <div class="tabs">
        @for (app of apps(); track app.application_id) {
          <button class="tab" [class.active]="selectedAppId() === app.application_id" (click)="selectApp(app.application_id)">
            {{ app.name_en }}
          </button>
        }
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <div>
          <div class="card-title">{{ getSelectedApp()?.name_en ?? '—' }} Permissions ({{ perms().length }})</div>
          <div class="card-sub">จัดกลุ่มตาม Permission Group</div>
        </div>
        <div class="search-box" style="width:220px">
          <span class="search-icon">🔍</span>
          <input [(ngModel)]="search" placeholder="ค้นหา resource / action…">
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Resource</th>
              <th>Action</th>
              <th>Group</th>
              <th>Display Name (TH)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--slate-400)">Loading…</td></tr>
            } @else if (filtered().length === 0) {
              <tr><td colspan="6">
                <div class="empty-state">
                  <div class="empty-icon">🔑</div>
                  <div class="empty-title">ไม่พบ Permission</div>
                  <div class="empty-sub">{{ selectedAppId() ? 'เพิ่ม Permission ใหม่สำหรับ Application นี้' : 'เลือก Application ด้านบน' }}</div>
                </div>
              </td></tr>
            } @else {
              @for (perm of filtered(); track perm.permission_id) {
                <tr>
                  <td>
                    <span class="mono" style="font-size:12px;background:var(--slate-100);padding:2px 8px;border-radius:4px;color:var(--navy)">
                      {{ perm.resource }}:{{ perm.action }}
                    </span>
                  </td>
                  <td><span style="font-weight:600;font-size:12.5px">{{ perm.resource }}</span></td>
                  <td>
                    <span class="badge b-blue" style="font-size:10.5px">{{ perm.action }}</span>
                  </td>
                  <td>
                    <span style="font-size:11.5px;color:var(--slate-500)">{{ perm.permission_group }}</span>
                  </td>
                  <td style="font-size:12.5px">{{ perm.display_name_th }}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" (click)="deletePerm(perm)">✕</button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary by Group -->
    @if (groups().length > 0) {
      <div style="margin-top:20px">
        <div class="card-title" style="margin-bottom:12px">Permission Groups</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          @for (g of groups(); track g.name) {
            <div style="background:#fff;border:1px solid var(--slate-200);border-radius:var(--r-sm);padding:8px 14px;display:flex;align-items:center;gap:8px">
              <span style="font-weight:700;font-size:13px">{{ g.name }}</span>
              <span class="badge b-blue">{{ g.count }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">เพิ่ม Permission ใหม่</div>
            <button class="modal-close" (click)="showModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" style="margin-bottom:14px">
              <span>ℹ</span>
              Permission จะถูกผูกกับ Application: <strong>{{ getSelectedApp()?.name_en }}</strong>
            </div>
            <div class="g2">
              <div class="form-group">
                <label class="form-label">Resource *</label>
                <input class="form-input" [(ngModel)]="form.resource" placeholder="e.g. invoice, report">
              </div>
              <div class="form-group">
                <label class="form-label">Action *</label>
                <input class="form-input" [(ngModel)]="form.action" placeholder="e.g. read, write, export">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Permission Group</label>
              <input class="form-input" [(ngModel)]="form.permission_group" placeholder="e.g. Invoice, Reports">
            </div>
            <div class="form-group">
              <label class="form-label">Display Name (TH)</label>
              <input class="form-input" [(ngModel)]="form.display_name_th" placeholder="ชื่อที่แสดงผล">
            </div>
            <div class="form-group">
              <label class="form-label">Display Name (EN)</label>
              <input class="form-input" [(ngModel)]="form.display_name_en" placeholder="Display name in English">
            </div>
            @if (form.resource && form.action) {
              <div class="alert alert-orange">
                <span>👀</span>
                Preview: <span class="mono">{{ form.resource }}:{{ form.action }}</span>
              </div>
            }
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving() || !form.resource || !form.action || !selectedAppId()">
              {{ saving() ? 'กำลังเพิ่ม…' : 'เพิ่ม Permission' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PermissionsComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  apps = signal<Application[]>([]);
  perms = signal<Permission[]>([]);
  loading = signal(false);
  showModal = signal(false);
  saving = signal(false);
  selectedAppId = signal<string>('');
  search = '';
  form: Partial<CreatePermissionRequest> = {};

  get filtered() {
    return () => {
      const q = this.search.toLowerCase();
      if (!q) return this.perms();
      return this.perms().filter(p => `${p.resource}:${p.action}`.includes(q) || p.display_name_th?.toLowerCase().includes(q) || p.permission_group?.toLowerCase().includes(q));
    };
  }

  get groups() {
    return () => {
      const map = new Map<string, number>();
      this.perms().forEach(p => map.set(p.permission_group || p.resource, (map.get(p.permission_group || p.resource) ?? 0) + 1));
      return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    };
  }

  ngOnInit() {
    this.api.getApplications().subscribe(apps => {
      this.apps.set(apps);
      if (apps.length) this.selectApp(apps[0].application_id);
    });
  }

  selectApp(id: string) {
    this.selectedAppId.set(id);
    this.loading.set(true);
    this.api.getApplicationPermissions(id).subscribe({
      next: p => { this.perms.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getSelectedApp() { return this.apps().find(a => a.application_id === this.selectedAppId()); }

  openModal() {
    if (!this.selectedAppId()) { this.toast.info('กรุณาเลือก Application ก่อน'); return; }
    this.form = {};
    this.showModal.set(true);
  }

  save() {
    if (!this.form.resource || !this.form.action || !this.selectedAppId()) return;
    this.saving.set(true);
    this.api.createPermission(this.selectedAppId(), this.form as CreatePermissionRequest).subscribe({
      next: () => { this.toast.success('เพิ่ม Permission สำเร็จ'); this.showModal.set(false); this.saving.set(false); this.selectApp(this.selectedAppId()); },
      error: () => { this.toast.error('เพิ่ม Permission ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  deletePerm(perm: Permission) {
    if (!confirm(`ลบ Permission "${perm.resource}:${perm.action}"?`)) return;
    this.api.deletePermission(this.selectedAppId(), perm.permission_id).subscribe({
      next: () => { this.toast.success('ลบ Permission สำเร็จ'); this.selectApp(this.selectedAppId()); },
      error: () => this.toast.error('ลบ Permission ไม่สำเร็จ'),
    });
  }
}
