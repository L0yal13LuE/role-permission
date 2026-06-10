import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoDataService, ApiRole, ApiPermission, ApiApp, ModeDto } from '../../../core/services/demo-data.service';
import { forkJoin } from 'rxjs';

type SvcId = string;
interface PermRow  { group: string; id: string; label: string; }
interface RoleEntry { id: string; label: string; badge: string; apiId: string; modes: string[]; }

const ICON_MAP: Record<string, string> = { FX: '💱', TBP: '🏦', ECI: '🛡️' };

const BADGE_MAP: Record<string, string> = {
  Admin: 'b-orange', Maker: 'b-blue', Approver: 'b-multiple',
  Viewer: 'b-viewer', 'Data Entry': 'b-inactive', Requester: 'b-purple',
};

// ── Mock data (fallback when API mode = mock) ──────────────────────────

const MOCK_SVCS: { id: SvcId; icon: string; label: string }[] = [
  { id: 'fx',  icon: '💱', label: 'FX' },
  { id: 'tbp', icon: '🏦', label: 'TBP' },
  { id: 'eci', icon: '🛡️', label: 'ECI' },
];

const MOCK_ROLES: RoleEntry[] = [
  { id: 'admin',     label: 'Admin',      badge: 'b-orange',   apiId: '', modes: [] },
  { id: 'maker',     label: 'Maker',      badge: 'b-blue',     apiId: '', modes: [] },
  { id: 'approver',  label: 'Approver',   badge: 'b-multiple', apiId: '', modes: [] },
  { id: 'viewer',    label: 'Viewer',     badge: 'b-viewer',   apiId: '', modes: [] },
  { id: 'dataentry', label: 'Data Entry', badge: 'b-inactive', apiId: '', modes: [] },
  { id: 'requester', label: 'Requester',  badge: 'b-purple',   apiId: '', modes: [] },
];

const MOCK_PERMS: Record<string, PermRow[]> = {
  fx:  [
    { group: 'ข้อมูล',  id: 'view',    label: 'ดูข้อมูล FX'      },
    { group: 'ข้อมูล',  id: 'export',  label: 'ส่งออกข้อมูล'     },
    { group: 'รายการ',  id: 'create',  label: 'สร้างรายการ FX'   },
    { group: 'รายการ',  id: 'cancel',  label: 'ยกเลิกรายการ'     },
    { group: 'อนุมัติ', id: 'approve', label: 'อนุมัติรายการ FX' },
    { group: 'ระบบ',    id: 'config',  label: 'ตั้งค่าระบบ'      },
  ],
  tbp: [
    { group: 'ข้อมูล',  id: 'view',    label: 'ดูข้อมูลสินเชื่อ' },
    { group: 'ข้อมูล',  id: 'export',  label: 'ส่งออกรายงาน'     },
    { group: 'คำขอ',    id: 'apply',   label: 'ยื่นขอสินเชื่อ'   },
    { group: 'คำขอ',    id: 'edit',    label: 'แก้ไขคำขอ'        },
    { group: 'อนุมัติ', id: 'approve', label: 'อนุมัติสินเชื่อ'  },
  ],
  eci: [
    { group: 'ข้อมูล',  id: 'view',    label: 'ดูข้อมูลประกัน'    },
    { group: 'ข้อมูล',  id: 'export',  label: 'ส่งออกรายงาน'      },
    { group: 'Claim',   id: 'submit',  label: 'ยื่น Claim Request' },
    { group: 'Claim',   id: 'edit',    label: 'แก้ไข Claim'       },
    { group: 'อนุมัติ', id: 'approve', label: 'อนุมัติ Claim'     },
  ],
};

const MOCK_DEFAULT: Record<string, Partial<Record<string, string[]>>> = {
  fx:  { admin:['view','export','create','cancel','approve','config'], maker:['view','create','cancel'], approver:['view','approve'], viewer:['view','export'], dataentry:['view','create'], requester:['view','create'] },
  tbp: { admin:['view','export','apply','edit','approve'], maker:['view','apply','edit'], approver:['view','approve'], viewer:['view','export'], dataentry:['view','apply'], requester:['view','apply'] },
  eci: { admin:['view','export','submit','edit','approve'], maker:['view','submit','edit'], approver:['view','approve'], viewer:['view','export'], dataentry:['view','submit'], requester:['view','submit'] },
};

interface AppTabPayload {
  roles: ApiRole[];
  permissions: ApiPermission[];
  rolePerms: Record<string, string[]>;
}

interface TabData {
  appId:   string;
  roles:   RoleEntry[];
  perms:   PermRow[];
  matrix:  Record<string, Set<string>>;
  original: Record<string, Set<string>>;
}

@Component({
  selector: 'app-role-builder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Role Builder</div>
          <div class="ss">กำหนด permission ของแต่ละ role ต่อ service</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          @if (loading()) { <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span> }
          @if (apiError()) { <span class="badge b-red">⚠️ {{ apiError() }}</span> }
          <button class="btn btn-outline" (click)="resetChanges()">↩ Reset</button>
          <button class="btn btn-primary" [disabled]="changedCount() === 0 || saving()" (click)="saveChanges()">
            {{ saving() ? '⏳...' : '💾 บันทึก' }} {{ changedCount() > 0 ? '(' + changedCount() + ')' : '' }}
          </button>
        </div>
      </div>
    </div>

    @if (saved()) {
      <div class="alert alert-green" style="margin-bottom:16px">✅ บันทึกเรียบร้อย</div>
    }

    <!-- Service Tabs -->
    <div class="tabs" style="margin-bottom:20px">
      @for (svc of svcs(); track svc.id) {
        <button class="tab" [class.active]="activeTab() === svc.id" (click)="switchTab(svc.id)">
          {{ svc.icon }} {{ svc.label }}
        </button>
      }
    </div>

    <!-- Matrix -->
    <div class="card">
      <div class="perm-wrap">
        <table class="ptable">
          <thead>
            <tr>
              <th style="min-width:160px">Permission</th>
              @for (role of currentRoles(); track role.id) {
                <th class="center" style="min-width:100px">
                  <span class="badge" [class]="role.badge">{{ role.label }}</span>
                  @if (apiMode.isReal()) {
                    <div class="mode-chips">
                      @for (m of role.modes; track m) {
                        <span class="badge b-purple mode-chip" title="คลิกเพื่อลบ mode" (click)="removeMode(role, m)">
                          {{ m }} ✕
                        </span>
                      }
                      @for (m of availableModes(role); track m.id) {
                        <span class="badge b-viewer mode-chip mode-chip-add" title="เพิ่ม mode" (click)="assignMode(role, m.code)">
                          + {{ m.name }}
                        </span>
                      }
                    </div>
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of groupedPerms(); track row.key) {
              <tr class="ptable-group-row">
                <td [attr.colspan]="currentRoles().length + 1">{{ row.key }}</td>
              </tr>
              @for (perm of row.perms; track perm.id) {
                <tr>
                  <td style="font-size:12.5px">{{ perm.label }}</td>
                  @for (role of currentRoles(); track role.id) {
                    <td class="center">
                      <div
                        class="pcheck-toggle"
                        [class.on]="hasPerm(role, perm)"
                        [class.off]="!hasPerm(role, perm)"
                        [class.changed]="isChanged(role, perm)"
                        (click)="togglePerm(role, perm)"
                      >{{ hasPerm(role, perm) ? '✓' : '—' }}</div>
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .pcheck-toggle.changed { outline: 2px solid #034EA1; outline-offset: 2px; }
    .mode-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; margin-top: 5px; }
    .mode-chip { font-size: 10px; cursor: pointer; user-select: none; }
    .mode-chip-add { opacity: 0.6; }
    .mode-chip-add:hover { opacity: 1; }
  `],
})
export class RoleBuilderComponent implements OnInit {
  protected apiMode  = inject(ApiModeService);
  private dataApi  = inject(DemoDataService);
  private apiApps: ApiApp[] = [];

  allModes = signal<ModeDto[]>([]);

  loading  = signal(false);
  saving   = signal(false);
  saved    = signal(false);
  apiError = signal<string | null>(null);

  activeTab = signal<SvcId>('fx');

  svcs = signal<{ id: SvcId; icon: string; label: string }[]>(MOCK_SVCS);

  tabData   = signal<Record<SvcId, TabData | null>>({});
  mockMatrix = signal<Record<SvcId, Record<string, Set<string>>>>(
    { fx: buildMockSets('fx'), tbp: buildMockSets('tbp'), eci: buildMockSets('eci') }
  );
  mockChanges = signal<Set<string>>(new Set());

  currentRoles = computed<RoleEntry[]>(() => {
    const td = this.tabData()[this.activeTab()];
    return td ? td.roles : MOCK_ROLES;
  });

  currentPerms = computed<PermRow[]>(() => {
    const td = this.tabData()[this.activeTab()];
    return td ? td.perms : (MOCK_PERMS[this.activeTab()] ?? []);
  });

  groupedPerms = computed(() => {
    const perms = this.currentPerms();
    const seen: string[] = [];
    perms.forEach(p => { if (!seen.includes(p.group)) seen.push(p.group); });
    return seen.map(g => ({ key: g, perms: perms.filter(p => p.group === g) }));
  });

  changedCount = computed(() => {
    const td = this.tabData()[this.activeTab()];
    if (!td) return this.mockChanges().size;
    let n = 0;
    for (const role of td.roles) {
      const cur  = td.matrix[role.apiId]  ?? new Set<string>();
      const orig = td.original[role.apiId] ?? new Set<string>();
      cur.forEach(p  => { if (!orig.has(p))  n++; });
      orig.forEach(p => { if (!cur.has(p))   n++; });
    }
    return n;
  });

  availableModes(role: RoleEntry): ModeDto[] {
    return this.allModes().filter(m => !role.modes.includes(m.code));
  }

  hasPerm(role: RoleEntry, perm: PermRow): boolean {
    const td = this.tabData()[this.activeTab()];
    if (td) return td.matrix[role.apiId]?.has(perm.id) ?? false;
    return this.mockMatrix()[this.activeTab()]?.[role.id]?.has(perm.id) ?? false;
  }

  isChanged(role: RoleEntry, perm: PermRow): boolean {
    const td = this.tabData()[this.activeTab()];
    if (td) {
      const cur  = td.matrix[role.apiId]?.has(perm.id)  ?? false;
      const orig = td.original[role.apiId]?.has(perm.id) ?? false;
      return cur !== orig;
    }
    return this.mockChanges().has(`${this.activeTab()}-${role.id}-${perm.id}`);
  }

  ngOnInit() {
    if (this.apiMode.isReal()) {
      this.dataApi.getModes().subscribe({ next: m => this.allModes.set(m) });
      this.loadReal();
    }
  }

  switchTab(tab: SvcId) {
    this.activeTab.set(tab);
    if (this.apiMode.isReal() && !this.tabData()[tab]) {
      this.loadTabReal(tab);
    }
  }

  assignMode(role: RoleEntry, mode: string) {
    const appId = this.tabData()[this.activeTab()]?.appId;
    if (!appId) return;
    this.dataApi.assignRoleMode(appId, role.apiId, mode).subscribe({
      next: () => this.loadTabReal(this.activeTab()),
      error: err => this.apiError.set(`Assign mode failed: ${err?.status}`),
    });
  }

  removeMode(role: RoleEntry, mode: string) {
    const appId = this.tabData()[this.activeTab()]?.appId;
    if (!appId) return;
    this.dataApi.removeRoleMode(appId, role.apiId, mode).subscribe({
      next: () => this.loadTabReal(this.activeTab()),
      error: err => this.apiError.set(`Remove mode failed: ${err?.status}`),
    });
  }

  private loadReal() {
    this.loading.set(true);
    this.apiError.set(null);

    this.dataApi.getApps().subscribe({
      next: apps => {
        this.apiApps = apps;

        const svcs = apps.map(a => ({
          id:    (a.appCode ?? a.id).toLowerCase(),
          icon:  ICON_MAP[a.appCode?.toUpperCase() ?? ''] ?? '📦',
          label: a.appCode?.toUpperCase() ?? a.appName ?? a.id.slice(0, 6),
        }));
        this.svcs.set(svcs);

        const emptyTabData: Record<string, TabData | null> = {};
        for (const s of svcs) emptyTabData[s.id] = null;
        this.tabData.set(emptyTabData);

        const ids = svcs.map(s => s.id);
        if (ids.length > 0 && !ids.includes(this.activeTab())) {
          this.activeTab.set(ids[0]);
        }

        this.loading.set(false);
        if (ids.length > 0) this.loadTabReal(this.activeTab());
      },
      error: err => {
        this.apiError.set(`Error ${err?.status}`);
        this.loading.set(false);
      },
    });
  }

  private loadTabReal(tab: SvcId) {
    const app = this.apiApps.find(a => (a.appCode ?? a.id).toLowerCase() === tab);
    if (!app) return;

    forkJoin({
      roles:       this.dataApi.getRoles(app.id),
      permissions: this.dataApi.getPermissions(app.id),
      rolePerms:   this.dataApi.getAllRolePermissions(app.id),
    }).subscribe({
      next: data => {
        this.tabData.update(td => ({ ...td, [tab]: buildTabData(app.id, data) }));
      },
      error: err => this.apiError.set(`Error ${err?.status}`),
    });
  }

  togglePerm(role: RoleEntry, perm: PermRow) {
    const tab = this.activeTab();
    const td  = this.tabData()[tab];
    if (td) {
      this.tabData.update(all => {
        const copy = { ...all };
        const t    = { ...copy[tab]! };
        const set  = new Set(t.matrix[role.apiId] ?? []);
        set.has(perm.id) ? set.delete(perm.id) : set.add(perm.id);
        t.matrix = { ...t.matrix, [role.apiId]: set };
        copy[tab] = t;
        return copy;
      });
    } else {
      const key = `${tab}-${role.id}-${perm.id}`;
      const defaultHas = (MOCK_DEFAULT[tab]?.[role.id] ?? []).includes(perm.id);
      this.mockMatrix.update(m => {
        const svcMap  = { ...m };
        const roleMap = { ...(svcMap[tab] ?? {}) };
        const set     = new Set(roleMap[role.id] ?? []);
        set.has(perm.id) ? set.delete(perm.id) : set.add(perm.id);
        roleMap[role.id] = set;
        svcMap[tab] = roleMap;
        return svcMap;
      });
      const nowHas = this.mockMatrix()[tab]?.[role.id]?.has(perm.id) ?? false;
      this.mockChanges.update(c => {
        const next = new Set(c);
        nowHas !== defaultHas ? next.add(key) : next.delete(key);
        return next;
      });
    }
  }

  resetChanges() {
    if (this.apiMode.isReal()) {
      this.tabData.update(all => {
        const copy = { ...all };
        const tab  = this.activeTab();
        if (copy[tab]) {
          copy[tab] = { ...copy[tab]!, matrix: deepCopySets(copy[tab]!.original) };
        }
        return copy;
      });
    } else {
      this.mockMatrix.set({ fx: buildMockSets('fx'), tbp: buildMockSets('tbp'), eci: buildMockSets('eci') });
      this.mockChanges.set(new Set());
    }
  }

  saveChanges() {
    if (!this.apiMode.isReal()) {
      this.mockChanges.set(new Set());
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
      return;
    }

    const tab = this.activeTab();
    const td  = this.tabData()[tab];
    if (!td) return;

    const roles = td.roles.map(role => ({
      roleId: role.apiId,
      permissionIds: [...(td.matrix[role.apiId] ?? new Set<string>())],
    }));

    this.saving.set(true);
    this.dataApi.syncRolePermissions(td.appId, roles).subscribe({
      next: () => {
        this.tabData.update(all => {
          const copy = { ...all };
          copy[tab] = { ...copy[tab]!, original: deepCopySets(copy[tab]!.matrix) };
          return copy;
        });
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: err => {
        this.apiError.set(`Save failed: ${err?.status}`);
        this.saving.set(false);
      },
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function buildMockSets(svc: string): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {};
  for (const [role, perms] of Object.entries(MOCK_DEFAULT[svc] ?? {})) {
    result[role] = new Set(perms);
  }
  return result;
}

function deepCopySets(src: Record<string, Set<string>>): Record<string, Set<string>> {
  const copy: Record<string, Set<string>> = {};
  for (const [k, v] of Object.entries(src)) copy[k] = new Set(v);
  return copy;
}

function buildTabData(appId: string, data: AppTabPayload | null): TabData | null {
  if (!data) return null;
  const roles: RoleEntry[] = data.roles.map(r => ({
    id:    r.id,
    label: r.name,
    badge: BADGE_MAP[r.name] ?? 'b-inactive',
    apiId: r.id,
    modes: r.modes ?? [],
  }));

  const perms: PermRow[] = data.permissions.map(p => ({
    group: p.permissionGroup ?? p.resource,
    id:    p.permissionId,
    label: p.displayNameTH ?? `${p.resource}:${p.action}`,
  }));

  const matrix: Record<string, Set<string>> = {};
  for (const r of data.roles) {
    const assigned = data.rolePerms[r.id] ?? [];
    matrix[r.id] = new Set(assigned);
  }

  return { appId, roles, perms, matrix, original: deepCopySets(matrix) };
}
