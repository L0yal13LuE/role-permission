import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { Company, CompanyApplication, CompanyApplicationMode, Role, Application, CreateCompanyRequest } from '../../core/models';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Companies</div>
          <div class="ss">จัดการบริษัทผู้เช่า, แอปพลิเคชันที่ subscribe และ Application Modes</div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ เพิ่ม Company</button>
      </div>
    </div>

    <div class="g2" style="align-items:start">
      <!-- Company List -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title">Companies ({{ companies().length }})</div>
        </div>
        @if (loading()) {
          <div style="padding:32px;text-align:center;color:var(--slate-400)">Loading…</div>
        } @else {
          @for (co of companies(); track co.company_id) {
            <div class="co-item" [class.selected]="selectedCompany()?.company_id === co.company_id" (click)="selectCompany(co)">
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">{{ co.name_en }}</div>
                <div style="font-size:11.5px;color:var(--slate-400)">{{ co.name_th }}</div>
                <div class="mono" style="font-size:10.5px;color:var(--slate-400);margin-top:2px">{{ co.juristic_id }}</div>
              </div>
              <span class="badge" [class]="co.status === 'Active' ? 'b-active' : 'b-inactive'">{{ co.status }}</span>
            </div>
          }
        }
      </div>

      <!-- Company Detail -->
      @if (selectedCompany()) {
        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd">
              <div>
                <div class="card-title">{{ selectedCompany()!.name_en }}</div>
                <div class="card-sub">{{ selectedCompany()!.name_th }}</div>
              </div>
            </div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12.5px">
                <div><span style="color:var(--slate-400);font-weight:700">Juristic ID</span><div class="mono">{{ selectedCompany()!.juristic_id }}</div></div>
                <div><span style="color:var(--slate-400);font-weight:700">Status</span><div><span class="badge mt-1" [class]="selectedCompany()!.status === 'Active' ? 'b-active' : 'b-inactive'">{{ selectedCompany()!.status }}</span></div></div>
              </div>
            </div>
          </div>

          <!-- Subscribed Applications -->
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd">
              <div class="card-title">Subscribed Applications</div>
              <button class="btn btn-outline btn-sm" (click)="openSubscribeModal()">+ Subscribe</button>
            </div>
            @if (loadingApps()) {
              <div style="padding:20px;text-align:center;color:var(--slate-400)">Loading…</div>
            } @else if (companyApps().length === 0) {
              <div class="empty-state" style="padding:24px"><div class="empty-icon">🚀</div><div class="empty-title">ยังไม่ได้ subscribe แอปไหน</div></div>
            } @else {
              @for (app of companyApps(); track app.application_id) {
                <div class="app-item" (click)="selectCompanyApp(app)">
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:12.5px">{{ app.name_en }}</div>
                    <div class="mono" style="font-size:10.5px;color:var(--slate-400)">{{ app.app_code }}</div>
                  </div>
                  <span class="badge" [class]="app.is_active ? 'b-active' : 'b-inactive'">{{ app.is_active ? 'Active' : 'Inactive' }}</span>
                  @if (selectedCompanyApp()?.application_id === app.application_id) {
                    <span style="color:var(--orange)">›</span>
                  }
                </div>
              }
            }
          </div>

          <!-- Modes Config -->
          @if (selectedCompanyApp()) {
            <div class="card">
              <div class="card-hd">
                <div>
                  <div class="card-title">Application Modes</div>
                  <div class="card-sub">{{ selectedCompanyApp()!.name_en }} — single_user / multiple_user</div>
                </div>
              </div>
              <div class="card-body">
                @if (loadingModes()) {
                  <div style="text-align:center;color:var(--slate-400)">Loading modes…</div>
                } @else {
                  @for (mode of modes(); track mode.mode) {
                    <div class="mode-card" style="margin-bottom:12px">
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                        <div>
                          <span class="badge" [class]="mode.mode === 'single_user' ? 'b-single' : 'b-multiple'">
                            {{ mode.mode === 'single_user' ? '1 User' : 'Multi User' }}
                          </span>
                          <span style="margin-left:8px;font-weight:700;font-size:13px">{{ mode.mode }}</span>
                        </div>
                        <div class="toggle-wrap" (click)="toggleMode(mode)">
                          <div class="toggle-track" [class.on]="mode.is_active">
                            <div class="toggle-thumb"></div>
                          </div>
                          <span class="toggle-label">{{ mode.is_active ? 'Active' : 'Inactive' }}</span>
                        </div>
                      </div>
                      @if (mode.mode === 'single_user' && mode.is_active) {
                        <div style="font-size:12px;color:var(--slate-500);margin-bottom:6px">Default Role (End User จะได้รับอัตโนมัติ)</div>
                        <div style="display:flex;gap:8px;align-items:center">
                          <select class="form-input" style="flex:1;font-size:12px" [(ngModel)]="mode.default_role_id">
                            <option [ngValue]="null">— ไม่มี default role —</option>
                            @for (role of appRoles(); track role.role_id) {
                              <option [value]="role.role_id">{{ role.name }}</option>
                            }
                          </select>
                          <button class="btn btn-outline btn-sm" (click)="saveDefaultRole(mode)">บันทึก</button>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card">
          <div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">เลือก Company จากด้านซ้าย</div></div>
        </div>
      }
    </div>

    <!-- Create Company Modal -->
    @if (showCreateModal()) {
      <div class="modal-overlay" (click)="showCreateModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">เพิ่ม Company ใหม่</div>
            <button class="modal-close" (click)="showCreateModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">ชื่อ (TH) *</label><input class="form-input" [(ngModel)]="coForm.name_th" placeholder="ชื่อภาษาไทย"></div>
            <div class="form-group"><label class="form-label">ชื่อ (EN) *</label><input class="form-input" [(ngModel)]="coForm.name_en" placeholder="Company Name"></div>
            <div class="form-group"><label class="form-label">Juristic ID *</label><input class="form-input" [(ngModel)]="coForm.juristic_id" placeholder="13 หลัก"></div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showCreateModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="createCompany()" [disabled]="saving() || !coForm.name_en || !coForm.juristic_id">
              {{ saving() ? 'กำลังสร้าง…' : 'สร้าง' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Subscribe Modal -->
    @if (showSubscribeModal()) {
      <div class="modal-overlay" (click)="showSubscribeModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">Subscribe Application</div>
            <button class="modal-close" (click)="showSubscribeModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Application</label>
              <select class="form-input" [(ngModel)]="subscribeAppId">
                <option value="">เลือก Application…</option>
                @for (app of availableApps(); track app.application_id) {
                  <option [value]="app.application_id">{{ app.name_en }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showSubscribeModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="subscribe()" [disabled]="saving() || !subscribeAppId">
              {{ saving() ? 'กำลัง Subscribe…' : 'Subscribe' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .co-item, .app-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-bottom: 1px solid var(--slate-100);
      cursor: pointer; transition: background .15s;
      &:hover { background: var(--slate-50); }
      &.selected { background: var(--orange-bg); border-left: 3px solid var(--orange); }
      &:last-child { border-bottom: none; }
    }
    .mode-card {
      border: 1px solid var(--slate-200); border-radius: var(--r-sm); padding: 14px;
    }
  `],
})
export class CompaniesComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  companies = signal<Company[]>([]);
  companyApps = signal<CompanyApplication[]>([]);
  allApps = signal<Application[]>([]);
  modes = signal<CompanyApplicationMode[]>([]);
  appRoles = signal<Role[]>([]);
  loading = signal(true);
  loadingApps = signal(false);
  loadingModes = signal(false);
  saving = signal(false);
  showCreateModal = signal(false);
  showSubscribeModal = signal(false);
  selectedCompany = signal<Company | null>(null);
  selectedCompanyApp = signal<CompanyApplication | null>(null);
  subscribeAppId = '';
  coForm: Partial<CreateCompanyRequest> = {};

  availableApps = () => this.allApps().filter(a => !this.companyApps().find(ca => ca.application_id === a.application_id));

  ngOnInit() {
    this.api.getCompanies().subscribe({ next: c => { this.companies.set(c); this.loading.set(false); } });
    this.api.getApplications().subscribe(a => this.allApps.set(a));
  }

  selectCompany(co: Company) {
    this.selectedCompany.set(co);
    this.selectedCompanyApp.set(null);
    this.loadingApps.set(true);
    this.api.getCompanyApplications(co.company_id).subscribe({
      next: apps => { this.companyApps.set(apps); this.loadingApps.set(false); },
      error: () => this.loadingApps.set(false),
    });
  }

  selectCompanyApp(app: CompanyApplication) {
    this.selectedCompanyApp.set(app);
    this.loadingModes.set(true);
    this.api.getCompanyApplicationModes(this.selectedCompany()!.company_id, app.application_id).subscribe({
      next: modes => { this.modes.set(modes); this.loadingModes.set(false); },
      error: () => this.loadingModes.set(false),
    });
    this.api.getAllRolesByApp(app.application_id).subscribe(r => this.appRoles.set(r));
  }

  toggleMode(mode: CompanyApplicationMode) {
    const co = this.selectedCompany()!;
    const app = this.selectedCompanyApp()!;
    this.api.updateCompanyApplicationMode(co.company_id, app.application_id, mode.mode, { is_active: !mode.is_active }).subscribe({
      next: m => { this.modes.update(modes => modes.map(mo => mo.mode === m.mode ? m : mo)); this.toast.success('อัปเดต Mode สำเร็จ'); },
      error: () => this.toast.error('อัปเดต Mode ไม่สำเร็จ'),
    });
  }

  saveDefaultRole(mode: CompanyApplicationMode) {
    if (!mode.default_role_id) return;
    const co = this.selectedCompany()!;
    const app = this.selectedCompanyApp()!;
    this.api.updateDefaultRole(co.company_id, app.application_id, { role_id: mode.default_role_id }).subscribe({
      next: () => this.toast.success('บันทึก Default Role สำเร็จ'),
      error: () => this.toast.error('บันทึกไม่สำเร็จ'),
    });
  }

  openCreateModal() { this.coForm = {}; this.showCreateModal.set(true); }

  createCompany() {
    if (!this.coForm.name_en || !this.coForm.juristic_id) return;
    this.saving.set(true);
    this.api.createCompany(this.coForm as CreateCompanyRequest).subscribe({
      next: () => { this.toast.success('สร้าง Company สำเร็จ'); this.showCreateModal.set(false); this.saving.set(false); this.api.getCompanies().subscribe(c => this.companies.set(c)); },
      error: () => { this.toast.error('สร้าง Company ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  openSubscribeModal() { this.subscribeAppId = ''; this.showSubscribeModal.set(true); }

  subscribe() {
    if (!this.subscribeAppId || !this.selectedCompany()) return;
    this.saving.set(true);
    this.api.subscribeCompanyToApplication(this.selectedCompany()!.company_id, this.subscribeAppId).subscribe({
      next: () => { this.toast.success('Subscribe สำเร็จ'); this.showSubscribeModal.set(false); this.saving.set(false); this.selectCompany(this.selectedCompany()!); },
      error: () => { this.toast.error('Subscribe ไม่สำเร็จ'); this.saving.set(false); },
    });
  }
}
