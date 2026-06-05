import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastService } from '../../core/services/toast.service';
import { Role, Application, Permission, CreateRoleRequest } from '../../core/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Roles</div>
          <div class="ss">จัดการ Role ต่อแต่ละ Application — global template และ company-specific</div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ สร้าง Role</button>
      </div>
    </div>

    <!-- App Filter -->
    <div style="margin-bottom:16px">
      <div class="tabs">
        <button class="tab" [class.active]="!selectedAppId()" (click)="selectApp(null)">ทั้งหมด</button>
        @for (app of apps(); track app.application_id) {
          <button class="tab" [class.active]="selectedAppId() === app.application_id" (click)="selectApp(app.application_id)">
            {{ app.name_en }}
          </button>
        }
      </div>
    </div>

    <div class="g2">
      <!-- Role List -->
      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">Roles ({{ filteredRoles().length }})</div>
          </div>
          <div class="search-box" style="width:180px">
            <span class="search-icon">🔍</span>
            <input [(ngModel)]="search" placeholder="ค้นหา…">
          </div>
        </div>
        <div style="overflow-y:auto;max-height:560px">
          @if (loading()) {
            <div style="padding:32px;text-align:center;color:var(--slate-400)">Loading…</div>
          } @else if (filteredRoles().length === 0) {
            <div class="empty-state"><div class="empty-icon">🛡</div><div class="empty-title">ไม่พบ Role</div></div>
          } @else {
            @for (role of filteredRoles(); track role.role_id) {
              <div class="role-item" [class.selected]="selectedRole()?.role_id === role.role_id" (click)="selectRole(role)">
                <div style="display:flex;align-items:center;gap:8px;flex:1">
                  <div class="role-dot" [style.background]="getRoleColor(role)"></div>
                  <div>
                    <div style="font-weight:700;font-size:13px;color:var(--navy)">{{ role.name }}</div>
                    <div style="font-size:11px;color:var(--slate-400)">{{ getAppName(role.application_id) }}</div>
                  </div>
                </div>
                <div style="display:flex;gap:6px;align-items:center">
                  <span class="badge" [class]="role.company_id ? 'b-company' : 'b-global'">
                    {{ role.company_id ? 'Company' : 'Global' }}
                  </span>
                  <button class="btn btn-danger btn-sm" (click)="$event.stopPropagation();deleteRole(role)">✕</button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Permission Matrix for Selected Role -->
      <div class="card">
        <div class="card-hd">
          <div>
            <div class="card-title">
              {{ selectedRole() ? 'Permissions: ' + selectedRole()!.name : 'เลือก Role เพื่อจัดการ Permissions' }}
            </div>
            @if (selectedRole()) {
              <div class="card-sub">คลิก toggle เพื่อเปิด/ปิด permission</div>
            }
          </div>
          @if (selectedRole() && pendingChanges().length > 0) {
            <button class="btn btn-primary btn-sm" (click)="savePermChanges()">
              บันทึก ({{ pendingChanges().length }})
            </button>
          }
        </div>
        @if (!selectedRole()) {
          <div class="empty-state"><div class="empty-icon">👈</div><div class="empty-title">เลือก Role จากด้านซ้าย</div></div>
        } @else if (loadingPerms()) {
          <div style="padding:32px;text-align:center;color:var(--slate-400)">Loading permissions…</div>
        } @else {
          <div class="perm-wrap">
            <table class="ptable">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Group</th>
                  <th class="center">{{ selectedRole()!.name }}</th>
                </tr>
              </thead>
              <tbody>
                @for (group of permGroups(); track group.name) {
                  <tr class="ptable-group-row"><td colspan="3">{{ group.name }}</td></tr>
                  @for (perm of group.perms; track perm.permission_id) {
                    <tr>
                      <td>
                        <div style="font-weight:600;font-size:12.5px">{{ perm.display_name_th || perm.resource + ':' + perm.action }}</div>
                        <div class="mono" style="font-size:10.5px;color:var(--slate-400)">{{ perm.resource }}:{{ perm.action }}</div>
                      </td>
                      <td><span style="font-size:11px;color:var(--slate-500)">{{ perm.permission_group }}</span></td>
                      <td class="center">
                        <div class="pcheck-toggle" [class]="hasPermission(perm.permission_id) ? 'on' : 'off'"
                             (click)="togglePermission(perm.permission_id)">
                          {{ hasPermission(perm.permission_id) ? '✓' : '–' }}
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Create Role Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hd">
            <div class="modal-title">สร้าง Role ใหม่</div>
            <button class="modal-close" (click)="showModal.set(false)">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Application *</label>
              <select class="form-input" [(ngModel)]="newRole.application_id">
                <option value="">เลือก Application…</option>
                @for (app of apps(); track app.application_id) {
                  <option [value]="app.application_id">{{ app.name_en }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Role Name *</label>
              <input class="form-input" [(ngModel)]="newRole.name" placeholder="e.g. Approver">
            </div>
            <div class="form-group">
              <label class="form-label">ประเภท</label>
              <select class="form-input" [(ngModel)]="newRole.type">
                <option value="global">Global Template (company_id = null)</option>
                <option value="company">Company-Specific</option>
              </select>
            </div>
            @if (newRole.type === 'company') {
              <div class="form-group">
                <label class="form-label">Company *</label>
                <select class="form-input" [(ngModel)]="newRole.company_id">
                  <option value="">เลือก Company…</option>
                  @for (c of companies(); track c.company_id) {
                    <option [value]="c.company_id">{{ c.name_en }}</option>
                  }
                </select>
              </div>
            }
          </div>
          <div class="modal-ft">
            <button class="btn btn-outline" (click)="showModal.set(false)">ยกเลิก</button>
            <button class="btn btn-primary" (click)="createRole()" [disabled]="saving() || !newRole.name || !newRole.application_id">
              {{ saving() ? 'กำลังสร้าง…' : 'สร้าง Role' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .role-item {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 16px; border-bottom: 1px solid var(--slate-100);
      cursor: pointer; transition: background .15s;
      &:hover { background: var(--slate-50); }
      &.selected { background: var(--orange-bg); border-left: 3px solid var(--orange); }
      &:last-child { border-bottom: none; }
    }
    .role-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  `],
})
export class RolesComponent implements OnInit {
  private api = inject(UserServiceApi);
  private toast = inject(ToastService);

  apps = signal<Application[]>([]);
  roles = signal<Role[]>([]);
  companies = signal<any[]>([]);
  appPerms = signal<Permission[]>([]);
  rolePerms = signal<Set<string>>(new Set());
  loading = signal(true);
  loadingPerms = signal(false);
  saving = signal(false);
  showModal = signal(false);
  selectedAppId = signal<string | null>(null);
  selectedRole = signal<Role | null>(null);
  pendingChanges = signal<{ id: string; grant: boolean }[]>([]);
  search = '';

  newRole: any = { application_id: '', name: '', type: 'global', company_id: '' };

  roleColors = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#14B8A6', '#EF4444'];

  filteredRoles = computed(() => {
    let list = this.roles();
    if (this.selectedAppId()) list = list.filter(r => r.application_id === this.selectedAppId());
    if (this.search) list = list.filter(r => r.name.toLowerCase().includes(this.search.toLowerCase()));
    return list;
  });

  permGroups = computed(() => {
    const perms = this.appPerms();
    const groups = new Map<string, Permission[]>();
    perms.forEach(p => {
      const g = p.permission_group || p.resource;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(p);
    });
    return Array.from(groups.entries()).map(([name, perms]) => ({ name, perms }));
  });

  ngOnInit() {
    this.api.getApplications().subscribe(apps => { this.apps.set(apps); this.loading.set(false); });
    this.api.getCompanies().subscribe(c => this.companies.set(c));
    this.loadAllRoles();
  }

  loadAllRoles() {
    this.api.getApplications().subscribe(apps => {
      const all: Role[] = [];
      let remaining = apps.length;
      if (remaining === 0) { this.roles.set([]); return; }
      apps.forEach(app => {
        this.api.getAllRolesByApp(app.application_id).subscribe({
          next: roles => { all.push(...roles); remaining--; if (remaining === 0) this.roles.set(all); },
          error: () => { remaining--; if (remaining === 0) this.roles.set(all); },
        });
      });
    });
  }

  selectApp(id: string | null) { this.selectedAppId.set(id); this.selectedRole.set(null); }

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.pendingChanges.set([]);
    this.loadingPerms.set(true);
    this.api.getApplicationPermissions(role.application_id).subscribe(perms => {
      this.appPerms.set(perms);
      this.api.getRolePermissions(role.application_id, role.role_id).subscribe({
        next: rp => { this.rolePerms.set(new Set(rp.map(p => p.permission_id))); this.loadingPerms.set(false); },
        error: () => this.loadingPerms.set(false),
      });
    });
  }

  hasPermission(permId: string): boolean {
    const change = this.pendingChanges().find(c => c.id === permId);
    if (change) return change.grant;
    return this.rolePerms().has(permId);
  }

  togglePermission(permId: string) {
    const current = this.hasPermission(permId);
    this.pendingChanges.update(changes => {
      const existing = changes.findIndex(c => c.id === permId);
      if (existing >= 0) {
        const origHas = this.rolePerms().has(permId);
        if (changes[existing].grant !== current) return changes.filter((_, i) => i !== existing);
        return changes.map((c, i) => i === existing ? { ...c, grant: !current } : c);
      }
      return [...changes, { id: permId, grant: !current }];
    });
  }

  savePermChanges() {
    if (!this.selectedRole()) return;
    const role = this.selectedRole()!;
    const changes = this.pendingChanges();
    const toGrant = changes.filter(c => c.grant).map(c => c.id);
    const toRevoke = changes.filter(c => !c.grant).map(c => c.id);

    this.saving.set(true);
    let ops = toGrant.length + toRevoke.length;
    const done = () => { ops--; if (ops <= 0) { this.saving.set(false); this.selectRole(role); this.toast.success('บันทึก permissions สำเร็จ'); } };

    if (toGrant.length) this.api.assignPermissionsToRole(role.application_id, role.role_id, { permission_ids: toGrant }).subscribe({ next: done, error: done });
    toRevoke.forEach(pid => this.api.removePermissionFromRole(role.application_id, role.role_id, pid).subscribe({ next: done, error: done }));
    if (ops === 0) { this.saving.set(false); this.toast.info('ไม่มีการเปลี่ยนแปลง'); }
  }

  openCreateModal() { this.newRole = { application_id: '', name: '', type: 'global', company_id: '' }; this.showModal.set(true); }

  createRole() {
    if (!this.newRole.name || !this.newRole.application_id) return;
    this.saving.set(true);
    const req: CreateRoleRequest = { name: this.newRole.name, company_id: this.newRole.type === 'company' ? this.newRole.company_id || null : null };
    this.api.createRole(this.newRole.application_id, req).subscribe({
      next: () => { this.toast.success('สร้าง Role สำเร็จ'); this.showModal.set(false); this.saving.set(false); this.loadAllRoles(); },
      error: () => { this.toast.error('สร้าง Role ไม่สำเร็จ'); this.saving.set(false); },
    });
  }

  deleteRole(role: Role) {
    if (!confirm(`ลบ Role "${role.name}"?`)) return;
    this.api.deleteRole(role.application_id, role.role_id).subscribe({
      next: () => { this.toast.success('ลบ Role สำเร็จ'); if (this.selectedRole()?.role_id === role.role_id) this.selectedRole.set(null); this.loadAllRoles(); },
      error: () => this.toast.error('ลบ Role ไม่สำเร็จ'),
    });
  }

  getAppName(appId: string) { return this.apps().find(a => a.application_id === appId)?.name_en ?? appId; }
  getRoleColor(role: Role) { return this.roleColors[role.role_id.charCodeAt(0) % this.roleColors.length]; }
}
