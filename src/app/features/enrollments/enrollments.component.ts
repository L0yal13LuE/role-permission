import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { Enrollment, Company, CreateEnrollmentRequest, Role } from '../../core/models';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Enrollments</div>
          <div class="ss">คำขอลงทะเบียนตัวแทน — Employee approve/reject เพื่อ swap Shell App role</div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ สร้าง Enrollment</button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div style="margin-bottom:16px">
      <div class="tabs">
        @for (s of statusFilters; track s.value) {
          <button class="tab" [class.active]="statusFilter() === s.value" (click)="statusFilter.set(s.value)">
            {{ s.label }} {{ s.value === 'all' ? '(' + enrollments().length + ')' : '(' + countByStatus(s.value) + ')' }}
          </button>
        }
      </div>
    </div>

    <!-- Pending Banner -->
    @if (pendingCount() > 0) {
      <div class="alert alert-orange" style="margin-bottom:16px">
        <span>⚠</span>
        มี <strong>{{ pendingCount() }}</strong> enrollment รอการ approve — กรุณาตรวจสอบ
      </div>
    }

    <div class="card">
      <div class="card-hd">
        <div class="card-title">Enrollment Requests</div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Flow ID</th>
              <th>Requestor</th>
              <th>Company</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--slate-400)">Loading…</td></tr>
            } @else if (filtered().length === 0) {
              <tr><td colspan="6">
                <div class="empty-state">
                  <div class="empty-icon">📋</div>
                  <div class="empty-title">ไม่มี Enrollment ที่ตรงกัน</div>
                </div>
              </td></tr>
            } @else {
              @for (e of filtered(); track e.flow_instance_id) {
                <tr>
                  <td><span class="mono" style="font-size:10.5px;color:var(--slate-400)">{{ e.flow_instance_id.slice(0,8) }}…</span></td>
                  <td style="font-weight:600">{{ e.owner_display_name ?? e.user_id }}</td>
                  <td style="font-size:12.5px">{{ e.company_name ?? e.company_id }}</td>
                  <td>
                    <span class="badge" [class]="getStatusBadge(e.status)">{{ e.status }}</span>
                  </td>
                  <td style="font-size:12px;color:var(--slate-400)">{{ e.created_at | date:'mediumDate' }}</td>
                  <td>
                    @if (e.status === 'Submitted') {
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm" style="background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0" (click)="approve(e)">
                          ✓ Approve
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="reject(e)">✕ Reject</button>
                      </div>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info Card -->
    <div class="card" style="margin-top:16px">
      <div class="card-hd"><div class="card-title">Enrollment Flow</div></div>
      <div class="card-body" style="font-size:12.5px;color:var(--slate-600)">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="badge b-blue">Submitted</span>
          <span style="color:var(--slate-400)">→</span>
          <span style="font-size:11.5px">Employee review</span>
          <span style="color:var(--slate-400)">→</span>
          <span class="badge b-active">Approved</span>
          <span style="font-size:11.5px;color:var(--slate-400)">(สร้าง CompanyRequestors + swap Shell role → ตัวแทน)</span>
          <span style="color:var(--slate-300)">|</span>
          <span class="badge b-red">Rejected</span>
        </div>
      </div>
    </div>

    <!-- Create Enrollment Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">สร้าง Enrollment Request</div>
            <button class="modal-close" (click)="showModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Email ตัวแทน *</label><input class="form-input" [(ngModel)]="form.email" placeholder="agent@company.com"></div>
            <div class="form-group"><label class="form-label">Display Name *</label><input class="form-input" [(ngModel)]="form.display_name" placeholder="ชื่อ-นามสกุล"></div>
            <div class="form-group">
              <label class="form-label">Company *</label>
              <select class="form-input" [(ngModel)]="form.company_id" (ngModelChange)="onCompanyChange($event)">
                <option value="">เลือก Company…</option>
                @for (c of companies(); track c.company_id) {
                  <option [value]="c.company_id">{{ c.name_en }}</option>
                }
              </select>
            </div>
            <hr style="margin:12px 0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div class="form-label" style="margin-bottom:0">Invited Users</div>
              <button class="btn btn-outline btn-sm" (click)="addInvitedUser()">+ เพิ่ม</button>
            </div>
            @for (inv of form.invited_users || []; track $index) {
              <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
                <input class="form-input" [(ngModel)]="inv.email" placeholder="email" style="flex:1">
                <select class="form-input" [(ngModel)]="inv.role_id" style="width:140px">
                  <option value="">Role…</option>
                  @for (r of inviteRoles(); track r.role_id) {
                    <option [value]="r.role_id">{{ r.name }}</option>
                  }
                </select>
                <button class="btn btn-danger btn-sm" (click)="removeInvitedUser($index)">✕</button>
              </div>
            }
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="create()" [disabled]="saving() || !form.email || !form.company_id">
              {{ saving() ? 'กำลังส่ง…' : 'ส่ง Enrollment' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EnrollmentsComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  enrollments = signal<Enrollment[]>([]);
  companies = signal<Company[]>([]);
  inviteRoles = signal<Role[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  statusFilter = signal<string>('all');
  form: Partial<CreateEnrollmentRequest> & { invited_users?: { email: string; role_id: string }[] } = { invited_users: [] };

  statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Finalized', value: 'Finalized' },
  ];

  filtered = () => this.statusFilter() === 'all' ? this.enrollments() : this.enrollments().filter(e => e.status === this.statusFilter());
  countByStatus = (s: string) => this.enrollments().filter(e => e.status === s).length;
  pendingCount = () => this.countByStatus('Submitted');

  ngOnInit() {
    this.load();
    this.api.getCompanies().subscribe(c => this.companies.set(c));
  }

  load() {
    this.loading.set(true);
    this.api.getEnrollments().subscribe({
      next: e => { this.enrollments.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onCompanyChange(companyId: string) {
    if (!companyId) { this.inviteRoles.set([]); return; }
    this.api.getCompanyApplications(companyId).subscribe(apps => {
      if (apps.length) this.api.getAllRolesByApp(apps[0].application_id).subscribe(r => this.inviteRoles.set(r));
    });
  }

  openCreateModal() { this.form = { invited_users: [] }; this.showModal.set(true); }
  addInvitedUser() { this.form.invited_users = [...(this.form.invited_users ?? []), { email: '', role_id: '' }]; }
  removeInvitedUser(i: number) { this.form.invited_users = this.form.invited_users?.filter((_, idx) => idx !== i); }

  create() {
    if (!this.form.email || !this.form.company_id) return;
    this.saving.set(true);
    const req: CreateEnrollmentRequest = {
      email: this.form.email!,
      display_name: this.form.display_name ?? this.form.email!.split('@')[0],
      company_id: this.form.company_id!,
      invited_users: this.form.invited_users?.filter(i => i.email && i.role_id) ?? [],
    };
    this.api.createEnrollment(req).subscribe({
      next: () => { this.toast.success('ส่ง Enrollment สำเร็จ'); this.showModal.set(false); this.saving.set(false); this.load(); },
      error: () => { this.toast.error('ส่ง Enrollment ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  approve(e: Enrollment) {
    if (!confirm(`Approve enrollment ของ ${e.owner_display_name ?? e.user_id}?`)) return;
    this.api.approveEnrollment(e.flow_instance_id).subscribe({
      next: res => { this.toast.success(`Approved! Shell role swapped → ${res.shell_role_swapped_to}`); this.load(); },
      error: () => this.toast.error('Approve ไม่สำเร็จ'),
    });
  }

  reject(e: Enrollment) {
    if (!confirm(`Reject enrollment ของ ${e.owner_display_name ?? e.user_id}?`)) return;
    this.api.rejectEnrollment(e.flow_instance_id).subscribe({
      next: () => { this.toast.success('Rejected'); this.load(); },
      error: () => this.toast.error('Reject ไม่สำเร็จ'),
    });
  }

  getStatusBadge(status: string) {
    const map: Record<string, string> = { Submitted: 'b-blue', Approved: 'b-active', Rejected: 'b-red', Finalized: 'b-global', Draft: 'b-inactive' };
    return map[status] ?? 'b-inactive';
  }
}
