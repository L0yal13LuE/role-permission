import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { Application, CreateApplicationRequest } from '../../core/models';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Applications</div>
          <div class="ss">จัดการแอปพลิเคชันที่ลงทะเบียนในระบบ</div>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">+ เพิ่ม Application</button>
      </div>
    </div>

    <div class="card">
      <div class="card-hd">
        <div class="card-title">รายชื่อ Applications ({{ apps().length }})</div>
        <div class="search-box" style="width:240px">
          <span class="search-icon">🔍</span>
          <input [(ngModel)]="search" placeholder="ค้นหาชื่อ / App Code…">
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Application</th>
              <th>App Code</th>
              <th>Base URL</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--slate-400)">Loading…</td></tr>
            } @else if (filtered().length === 0) {
              <tr><td colspan="5">
                <div class="empty-state">
                  <div class="empty-icon">🚀</div>
                  <div class="empty-title">ไม่พบ Application</div>
                  <div class="empty-sub">{{ search ? 'ลองค้นหาด้วยคำอื่น' : 'เพิ่ม Application ใหม่เพื่อเริ่มต้น' }}</div>
                </div>
              </td></tr>
            } @else {
              @for (app of filtered(); track app.application_id) {
                <tr>
                  <td>
                    <div style="font-weight:700;color:var(--navy)">{{ app.name_en }}</div>
                    <div style="font-size:11.5px;color:var(--slate-400)">{{ app.name_th }}</div>
                  </td>
                  <td><span class="mono" style="font-size:12px;background:var(--slate-100);padding:2px 7px;border-radius:4px">{{ app.app_code }}</span></td>
                  <td style="font-size:11.5px;color:var(--slate-500);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ app.base_url }}</td>
                  <td>
                    <span class="badge" [class]="app.is_active ? 'b-active' : 'b-inactive'">
                      {{ app.is_active ? '✓ Active' : '✕ Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" (click)="editApp(app)">Edit</button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">{{ editing() ? 'แก้ไข Application' : 'เพิ่ม Application ใหม่' }}</div>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">ชื่อ (TH)</label>
              <input class="form-input" [(ngModel)]="form.name_th" placeholder="ชื่อภาษาไทย">
            </div>
            <div class="form-group">
              <label class="form-label">ชื่อ (EN) *</label>
              <input class="form-input" [(ngModel)]="form.name_en" placeholder="Application Name">
            </div>
            <div class="form-group">
              <label class="form-label">App Code *</label>
              <input class="form-input" [(ngModel)]="form.app_code" placeholder="e.g. inventory-app">
            </div>
            <div class="form-group">
              <label class="form-label">Base URL *</label>
              <input class="form-input" [(ngModel)]="form.base_url" placeholder="https://...">
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="closeModal()">ยกเลิก</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving() || !form.name_en || !form.app_code">
              {{ saving() ? 'กำลังบันทึก…' : 'บันทึก' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ApplicationsComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  apps = signal<Application[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editing = signal<Application | null>(null);
  search = '';

  form: Partial<CreateApplicationRequest & { name_th: string }> = {};

  get filtered() {
    return () => {
      const q = this.search.toLowerCase();
      return q ? this.apps().filter(a => a.name_en.toLowerCase().includes(q) || a.app_code.toLowerCase().includes(q) || a.name_th?.toLowerCase().includes(q)) : this.apps();
    };
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getApplications().subscribe({
      next: apps => { this.apps.set(apps); this.loading.set(false); },
      error: () => { this.toast.error('โหลดข้อมูลไม่สำเร็จ'); this.loading.set(false); },
    });
  }

  editApp(app: Application) {
    this.editing.set(app);
    this.form = { name_th: app.name_th, name_en: app.name_en, app_code: app.app_code, base_url: app.base_url };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editing.set(null); this.form = {}; }

  save() {
    if (!this.form.name_en || !this.form.app_code || !this.form.base_url) return;
    this.saving.set(true);
    const req = this.form as CreateApplicationRequest & { name_th: string };
    const obs = this.editing()
      ? this.api.updateApplication(this.editing()!.application_id, req)
      : this.api.createApplication(req);

    obs.subscribe({
      next: () => { this.toast.success('บันทึกสำเร็จ'); this.closeModal(); this.load(); this.saving.set(false); },
      error: () => { this.toast.error('บันทึกไม่สำเร็จ'); this.saving.set(false); },
    });
  }
}
