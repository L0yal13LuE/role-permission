import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserRole, Role, Company, Application, CreateUserRequest } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Users</div>
          <div class="ss">จัดการผู้ใช้งานและการมอบหมาย Role</div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ เพิ่ม User</button>
      </div>
    </div>

    <div class="g2" style="align-items:start">
      <!-- User List -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title">Users ({{ users().length }})</div>
          <div class="search-box" style="width:180px">
            <span class="search-icon">🔍</span>
            <input [(ngModel)]="search" placeholder="ค้นหา…">
          </div>
        </div>
        @if (loading()) {
          <div style="padding:32px;text-align:center;color:var(--slate-400)">Loading…</div>
        } @else {
          @for (u of filtered(); track u.user_id) {
            <div class="user-item" [class.selected]="selectedUser()?.user_id === u.user_id" (click)="selectUser(u)">
              <div class="avatar-sm" [style.background]="getUserColor(u)">{{ u.display_name[0] }}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">{{ u.display_name }}</div>
                <div style="font-size:11.5px;color:var(--slate-400)">{{ u.email }}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <span class="badge" [class]="u.user_type === 'Employee' ? 'b-orange' : 'b-blue'" style="font-size:10px">{{ u.user_type }}</span>
                <span class="badge" [class]="u.status === 'Active' ? 'b-active' : 'b-inactive'" style="font-size:10px">{{ u.status }}</span>
              </div>
            </div>
          }
        }
      </div>

      <!-- User Detail & Roles -->
      @if (selectedUser()) {
        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd">
              <div>
                <div class="card-title">{{ selectedUser()!.display_name }}</div>
                <div class="card-sub">{{ selectedUser()!.email }}</div>
              </div>
              <div style="display:flex;gap:6px">
                <span class="badge b-orange">{{ selectedUser()!.user_type }}</span>
                <span class="badge" [class]="selectedUser()!.status === 'Active' ? 'b-active' : 'b-inactive'">{{ selectedUser()!.status }}</span>
              </div>
            </div>
            <div class="card-body">
              <div style="font-size:12px;color:var(--slate-500)">
                Created: {{ selectedUser()!.created_at | date:'mediumDate' }}
              </div>
            </div>
          </div>

          <!-- Role Assignments -->
          <div class="card">
            <div class="card-hd">
              <div>
                <div class="card-title">Role Assignments</div>
                <div class="card-sub">Role ที่ user นี้ได้รับในแต่ละ app-context</div>
              </div>
              <button class="btn btn-outline btn-sm" (click)="openAssignModal()">+ Assign Role</button>
            </div>
            @if (loadingRoles()) {
              <div style="padding:24px;text-align:center;color:var(--slate-400)">Loading…</div>
            } @else if (userRoles().length === 0) {
              <div class="empty-state" style="padding:24px"><div class="empty-icon">🛡</div><div class="empty-title">ยังไม่มี Role</div></div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr><th>Application</th><th>Role</th><th>Company</th><th>Assigned</th><th></th></tr></thead>
                  <tbody>
                    @for (ur of userRoles(); track ur.role_id + ur.company_id) {
                      <tr>
                        <td style="font-weight:600">{{ ur.app_name ?? ur.application_id }}</td>
                        <td><span class="badge b-blue">{{ ur.role_name ?? ur.role_id }}</span></td>
                        <td style="font-size:11.5px;color:var(--slate-500)">{{ ur.company_id ? getCompanyName(ur.company_id) : '— Shell —' }}</td>
                        <td style="font-size:11.5px;color:var(--slate-400)">{{ ur.assigned_at | date:'shortDate' }}</td>
                        <td>
                          <button class="btn btn-danger btn-sm" (click)="removeRole(ur)">✕</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">เลือก User จากด้านซ้าย</div></div>
        </div>
      }
    </div>

    <!-- Create User Modal -->
    @if (showCreateModal()) {
      <div class="modal-overlay" (click)="showCreateModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">เพิ่ม User ใหม่</div>
            <button class="modal-close" (click)="showCreateModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Display Name *</label><input class="form-input" [(ngModel)]="userForm.display_name" placeholder="ชื่อ-นามสกุล"></div>
            <div class="form-group"><label class="form-label">Email *</label><input class="form-input" [(ngModel)]="userForm.email" placeholder="user@example.com"></div>
            <div class="form-group">
              <label class="form-label">User Type</label>
              <select class="form-input" [(ngModel)]="userForm.user_type">
                <option value="Customer">Customer</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showCreateModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="createUser()" [disabled]="saving() || !userForm.email || !userForm.display_name">
              {{ saving() ? 'กำลังสร้าง…' : 'สร้าง User' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Assign Role Modal -->
    @if (showAssignModal()) {
      <div class="modal-overlay" (click)="showAssignModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">Assign Role ให้ {{ selectedUser()?.display_name }}</div>
            <button class="modal-close" (click)="showAssignModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Application *</label>
              <select class="form-input" [(ngModel)]="assignForm.application_id" (ngModelChange)="onAssignAppChange($event)">
                <option value="">เลือก Application…</option>
                @for (app of allApps(); track app.application_id) {
                  <option [value]="app.application_id">{{ app.name_en }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-input" [(ngModel)]="assignForm.role_id">
                <option value="">เลือก Role…</option>
                @for (r of assignableRoles(); track r.role_id) {
                  <option [value]="r.role_id">{{ r.name }}{{ r.company_id ? ' (Company)' : ' (Global)' }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Company (ระบุถ้าเป็น Remote App)</label>
              <select class="form-input" [(ngModel)]="assignForm.company_id">
                <option value="">— Shell App (ไม่มี company) —</option>
                @for (c of companies(); track c.company_id) {
                  <option [value]="c.company_id">{{ c.name_en }}</option>
                }
              </select>
            </div>
            <div class="alert alert-orange" style="font-size:12px">
              <span>⚠</span> 1 Role ต่อ 1 app-context เท่านั้น — ถ้ามี Role อยู่แล้วจะเกิด 409 Conflict
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showAssignModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="assignRole()" [disabled]="saving() || !assignForm.role_id">
              {{ saving() ? 'กำลัง Assign…' : 'Assign Role' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .user-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid var(--slate-100); cursor: pointer; transition: background .15s;
      &:hover { background: var(--slate-50); }
      &.selected { background: var(--orange-bg); border-left: 3px solid var(--orange); }
      &:last-child { border-bottom: none; }
    }
  `],
})
export class UsersComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  users = signal<User[]>([]);
  companies = signal<Company[]>([]);
  allApps = signal<Application[]>([]);
  userRoles = signal<UserRole[]>([]);
  assignableRoles = signal<Role[]>([]);
  loading = signal(true);
  loadingRoles = signal(false);
  saving = signal(false);
  showCreateModal = signal(false);
  showAssignModal = signal(false);
  selectedUser = signal<User | null>(null);
  search = '';
  userForm: Partial<CreateUserRequest> = { user_type: 'Customer' };
  assignForm: any = { application_id: '', role_id: '', company_id: '' };

  filtered = () => {
    const q = this.search.toLowerCase();
    return q ? this.users().filter(u => u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : this.users();
  };

  ngOnInit() {
    this.api.getUsers().subscribe({ next: u => { this.users.set(u); this.loading.set(false); } });
    this.api.getCompanies().subscribe(c => this.companies.set(c));
    this.api.getApplications().subscribe(a => this.allApps.set(a));
  }

  selectUser(u: User) {
    this.selectedUser.set(u);
    this.loadingRoles.set(true);
    this.api.getUserRoles(u.user_id).subscribe({
      next: roles => { this.userRoles.set(roles); this.loadingRoles.set(false); },
      error: () => this.loadingRoles.set(false),
    });
  }

  onAssignAppChange(appId: string) {
    this.assignForm.role_id = '';
    if (!appId) { this.assignableRoles.set([]); return; }
    this.api.getAllRolesByApp(appId).subscribe(r => this.assignableRoles.set(r));
  }

  openCreateModal() { this.userForm = { user_type: 'Customer' }; this.showCreateModal.set(true); }
  openAssignModal() { this.assignForm = { application_id: '', role_id: '', company_id: '' }; this.assignableRoles.set([]); this.showAssignModal.set(true); }

  createUser() {
    if (!this.userForm.email || !this.userForm.display_name) return;
    this.saving.set(true);
    this.api.createUser(this.userForm as CreateUserRequest).subscribe({
      next: () => { this.toast.success('สร้าง User สำเร็จ'); this.showCreateModal.set(false); this.saving.set(false); this.api.getUsers().subscribe(u => this.users.set(u)); },
      error: () => { this.toast.error('สร้าง User ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  assignRole() {
    if (!this.assignForm.role_id || !this.selectedUser()) return;
    this.saving.set(true);
    const companyId: string | null = this.assignForm.company_id || null;
    this.api.assignRoleToUserInCompany(companyId, this.selectedUser()!.user_id, { role_id: this.assignForm.role_id }).subscribe({
      next: () => { this.toast.success('Assign Role สำเร็จ'); this.showAssignModal.set(false); this.saving.set(false); this.selectUser(this.selectedUser()!); },
      error: (e: any) => { this.toast.error(e?.error?.error ?? 'Assign Role ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  removeRole(ur: UserRole) {
    if (!confirm('ลบ Role assignment นี้?')) return;
    this.api.removeRoleFromUser(ur.company_id, this.selectedUser()!.user_id, ur.role_id).subscribe({
      next: () => { this.toast.success('ลบ Role สำเร็จ'); this.selectUser(this.selectedUser()!); },
      error: () => this.toast.error('ลบ Role ไม่สำเร็จ'),
    });
  }

  getUserColor(u: User) { return u.user_type === 'Employee' ? 'var(--orange)' : u.user_id.charCodeAt(0) % 2 ? 'var(--blue)' : 'var(--purple)'; }
  getCompanyName(id: string) { return this.companies().find(c => c.company_id === id)?.name_en ?? id; }
}
