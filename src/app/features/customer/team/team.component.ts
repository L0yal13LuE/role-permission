import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoContextService } from '../../../core/services/demo-context.service';
import { DemoDataService, ApiMember, ApiRole } from '../../../core/services/demo-data.service';
import { switchMap, forkJoin, of } from 'rxjs';

interface Member {
  id: string; name: string; initials: string; email: string; color: string;
  roles: Record<string, string>;   // appCode → roleName
  roleIds: Record<string, string>; // appCode → roleId (for API delete)
}

const COLORS = ['#034EA1','#059669','#7C3AED','#B45309','#DC2626','#0891B2','#BE185D'];

const MOCK_MEMBERS: Member[] = [
  { id: 'u1', name: 'ธีรพงศ์ สุขดี',    initials: 'ธร', email: 'teeraphong@scg.com', color: '#034EA1', roles: { FX:'Admin',     TBP:'Admin',      ECI:'Admin'     }, roleIds: {} },
  { id: 'u2', name: 'สมชาย ใจดี',       initials: 'สช', email: 'somchai@scg.com',    color: '#059669', roles: { FX:'Maker',     TBP:'Maker',      ECI:'Maker'     }, roleIds: {} },
  { id: 'u3', name: 'วิภาวดี รักเรียน', initials: 'วภ', email: 'wiphawadi@scg.com',  color: '#7C3AED', roles: { FX:'Approver',  TBP:'Viewer',     ECI:'Approver'  }, roleIds: {} },
  { id: 'u4', name: 'อรอุมา แสนดี',     initials: 'อร', email: 'ornuma@scg.com',     color: '#B45309', roles: { FX:'Viewer',    TBP:'Viewer',     ECI:'Viewer'    }, roleIds: {} },
  { id: 'u5', name: 'ชัยวัฒน์ มั่นคง',  initials: 'ชว', email: 'chaiwat@scg.com',    color: '#DC2626', roles: { FX:'Requester', TBP:'Data Entry', ECI:'Requester' }, roleIds: {} },
];

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sec-hd-row">
        <div>
          <div class="sh">Team Management — {{ companyName() }}</div>
          <div class="ss">กำหนด role ของสมาชิกแต่ละคนในแต่ละ service</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          @if (loading()) { <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span> }
          @if (apiError()) { <span class="badge b-red">⚠️ {{ apiError() }}</span> }
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? '⏳ กำลังบันทึก...' : '💾 บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    @if (saved()) {
      <div class="alert alert-green" style="margin-bottom:16px">✅ บันทึกเรียบร้อย</div>
    }

    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>สมาชิก</th>
              <th>Email</th>
              @for (svc of appCodes(); track svc.code) {
                <th style="min-width:140px">
                  {{ svc.icon }} {{ svc.code }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (m of members(); track m.id) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar-sm" [style.background]="m.color">{{ m.initials }}</div>
                    <span style="font-weight:600">{{ m.name }}</span>
                  </div>
                </td>
                <td style="color:#64748B;font-size:12px">{{ m.email }}</td>
                @for (svc of appCodes(); track svc.code) {
                  <td>
                    <select class="form-input" style="padding:5px 8px;font-size:12px"
                      [ngModel]="m.roles[svc.code]"
                      (ngModelChange)="setRole(m, svc.code, $event)">
                      <option value="">— ไม่กำหนด —</option>
                      @for (r of roleOptions(svc.code); track r.id) {
                        <option [value]="r.name">{{ r.name }}</option>
                      }
                    </select>
                  </td>
                }
              </tr>
            }
            @empty {
              <tr><td [attr.colspan]="2 + appCodes().length" style="text-align:center;color:#94A3B8;padding:32px">
                ไม่มีสมาชิก
              </td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TeamComponent implements OnInit {
  private apiMode = inject(ApiModeService);
  private demoCtx = inject(DemoContextService);
  private dataApi = inject(DemoDataService);

  loading    = signal(false);
  saving     = signal(false);
  saved      = signal(false);
  apiError   = signal<string | null>(null);
  companyName = signal('SCG Group');

  members   = signal<Member[]>(MOCK_MEMBERS);
  availableRoles = signal<Record<string, ApiRole[]>>({
    FX:  [{ id:'r1',name:'Admin',description:'',isActive:true },{ id:'r2',name:'Maker',description:'',isActive:true },{ id:'r3',name:'Approver',description:'',isActive:true },{ id:'r4',name:'Viewer',description:'',isActive:true },{ id:'r5',name:'Requester',description:'',isActive:true }],
    TBP: [{ id:'r1',name:'Admin',description:'',isActive:true },{ id:'r2',name:'Maker',description:'',isActive:true },{ id:'r3',name:'Approver',description:'',isActive:true },{ id:'r4',name:'Viewer',description:'',isActive:true },{ id:'r6',name:'Data Entry',description:'',isActive:true }],
    ECI: [{ id:'r1',name:'Admin',description:'',isActive:true },{ id:'r2',name:'Maker',description:'',isActive:true },{ id:'r3',name:'Approver',description:'',isActive:true },{ id:'r4',name:'Viewer',description:'',isActive:true },{ id:'r5',name:'Requester',description:'',isActive:true }],
  });

  appCodes = signal<{ code: string; id: string; icon: string }[]>([
    { code: 'FX',  id: '', icon: '💱' },
    { code: 'TBP', id: '', icon: '🏦' },
    { code: 'ECI', id: '', icon: '🛡️' },
  ]);

  roleOptions(code: string): ApiRole[] {
    return this.availableRoles()[code] ?? [];
  }

  setRole(member: Member, code: string, roleName: string) {
    this.members.update(list =>
      list.map(m => m.id === member.id ? { ...m, roles: { ...m.roles, [code]: roleName } } : m)
    );
  }

  ngOnInit() {
    if (this.apiMode.isReal()) this.loadReal();
  }

  private loadReal() {
    this.loading.set(true);
    this.apiError.set(null);

    this.demoCtx.bootstrap().pipe(
      switchMap(ctx => {
        const subscribedApps = ctx.apps.filter(a => a.isActive);
        const appEntries = subscribedApps.slice(0, 3).map(a => ({
          code: a.code?.toUpperCase() ?? a.id.slice(0, 4),
          id:   a.id,
          icon: a.code === 'FX' ? '💱' : a.code === 'TBP' ? '🏦' : a.code === 'ECI' ? '🛡️' : '📦',
        }));

        return forkJoin({
          members: this.dataApi.getMembers(ctx.companyId),
          roles: forkJoin(
            Object.fromEntries(appEntries.map(a => [a.code, this.dataApi.getRoles(a.id)]))
          ),
          ctx: of(ctx),
          appEntries: of(appEntries),
        });
      })
    ).subscribe({
      next: ({ members, roles, ctx, appEntries }) => {
        this.companyName.set((ctx as any).companyNameTH || 'บริษัท');
        this.appCodes.set(appEntries as any[]);
        this.availableRoles.set(roles as any);

        this.members.set((members as ApiMember[]).map((m, i) => ({
          id:       m.userId,
          name:     m.fullName || m.displayName || m.email,
          initials: (m.fullName || m.email).slice(0, 2),
          email:    m.email,
          color:    COLORS[i % COLORS.length],
          roles:    { [(appEntries as any[])[0]?.code ?? '']: m.role },
          roleIds:  {},
        })));

        this.loading.set(false);
      },
      error: err => {
        this.apiError.set(`Error ${err?.status}`);
        this.loading.set(false);
      },
    });
  }

  save() {
    if (!this.apiMode.isReal()) {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
      return;
    }

    this.saving.set(true);
    // Real save: DELETE old role + POST new role per changed member×app
    // Simplified: just show success for demo
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    }, 800);
  }
}
