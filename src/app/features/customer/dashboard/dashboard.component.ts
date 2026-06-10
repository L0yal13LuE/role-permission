import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoContextService } from '../../../core/services/demo-context.service';
import { DemoDataService, ApiMember, ApiCompanyApp, ApiApp } from '../../../core/services/demo-data.service';
import { switchMap, forkJoin, of } from 'rxjs';

interface SvcCard { id: string; icon: string; name: string; code: string; mode: string; }
interface MemberRow { id: string; name: string; initials: string; email: string; color: string; roles: Record<string,string>; }

const COLORS = ['#034EA1','#059669','#7C3AED','#B45309','#DC2626','#0891B2','#BE185D'];
const ICONS: Record<string, string> = { FX: '💱', TBP: '🏦', ECI: '🛡️' };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sec-hd">
      <div class="sh">Dashboard — {{ companyName() }}</div>
      <div class="ss">ภาพรวม service และ team ของบริษัท</div>
      @if (loading()) { <span style="font-size:12px;color:#64748B;margin-top:4px;display:block">⏳ กำลังโหลด...</span> }
      @if (apiError()) { <div class="alert alert-red" style="margin-top:8px">⚠️ {{ apiError() }}</div> }
    </div>

    <div class="alert alert-green" style="margin-bottom:20px">
      ✅ {{ companyName() }} มี {{ services().length }} services ที่ active
    </div>

    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:#DBEAFE">📦</div>
        <div class="stat-lbl">Services</div>
        <div class="stat-val">{{ services().length }}</div>
        <div class="stat-note">{{ services().map(s => s.code).join(', ') || '—' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">👥</div>
        <div class="stat-lbl">Members</div>
        <div class="stat-val">{{ members().length }}</div>
        <div class="stat-note">ทีมงานทั้งหมด</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#EDE9FE">🛡️</div>
        <div class="stat-lbl">Role Assignments</div>
        <div class="stat-val">{{ members().length * services().length }}</div>
        <div class="stat-note">ใน {{ services().length }} services</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF9C3">⚙️</div>
        <div class="stat-lbl">Approval Types</div>
        <div class="stat-val">{{ uniqueModes() }}</div>
        <div class="stat-note">Single & Multiple</div>
      </div>
    </div>

    <!-- Services -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-hd"><div class="card-title">Services ที่ใช้งาน</div></div>
      <div class="card-body">
        <div class="g3">
          @for (svc of services(); track svc.id) {
            <div class="svc-card">
              <div class="svc-icon">{{ svc.icon }}</div>
              <div class="svc-name">{{ svc.name }}</div>
              <div class="svc-code mono">{{ svc.code }}</div>
              <span class="badge" [class]="svc.mode === 'single_user' ? 'b-single' : 'b-multiple'" style="margin-top:8px">
                {{ svc.mode === 'single_user' ? 'Single' : 'Multiple' }} Mode
              </span>
            </div>
          }
          @empty {
            <div style="color:#94A3B8;font-size:13px">ยังไม่มี service</div>
          }
        </div>
      </div>
    </div>

    <!-- Team -->
    <div class="card">
      <div class="card-hd">
        <div class="card-title">Team Members</div>
        <span class="badge b-inactive">{{ members().length }} คน</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>Email</th>
              <th>Role (Company)</th>
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
                <td><span class="badge b-viewer">{{ m.roles['company'] || '—' }}</span></td>
              </tr>
            }
            @empty {
              <tr><td colspan="3">
                <div class="empty-state">
                  <div class="empty-icon">👥</div>
                  <div class="empty-title">ไม่มีสมาชิก</div>
                </div>
              </td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .svc-card {
      border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; align-items: flex-start;
    }
    .svc-icon { font-size: 24px; margin-bottom: 8px; }
    .svc-name { font-size: 13.5px; font-weight: 700; color: #0F172A; }
    .svc-code { font-size: 11px; color: #64748B; margin-top: 2px; }
  `],
})
export class DashboardComponent implements OnInit {
  private apiMode = inject(ApiModeService);
  private demoCtx = inject(DemoContextService);
  private dataApi = inject(DemoDataService);

  loading    = signal(false);
  apiError   = signal<string | null>(null);
  companyName = signal('SCG Group');
  services   = signal<SvcCard[]>([
    { id: 'fx',  icon: '💱', name: 'FX Forward Contract', code: 'FX',  mode: 'multiple_user' },
    { id: 'tbp', icon: '🏦', name: 'TBP สินเชื่อ',        code: 'TBP', mode: 'single_user'   },
    { id: 'eci', icon: '🛡️', name: 'ECI ประกันการส่งออก', code: 'ECI', mode: 'multiple_user' },
  ]);
  members = signal<MemberRow[]>([
    { id: 'u1', name: 'ธีรพงศ์ สุขดี',    initials: 'ธร', email: 'teeraphong@scg.com', color: '#034EA1', roles: { company: 'Admin'    } },
    { id: 'u2', name: 'สมชาย ใจดี',       initials: 'สช', email: 'somchai@scg.com',    color: '#059669', roles: { company: 'Maker'    } },
    { id: 'u3', name: 'วิภาวดี รักเรียน', initials: 'วภ', email: 'wiphawadi@scg.com',  color: '#7C3AED', roles: { company: 'Approver' } },
    { id: 'u4', name: 'อรอุมา แสนดี',     initials: 'อร', email: 'ornuma@scg.com',     color: '#B45309', roles: { company: 'Viewer'   } },
    { id: 'u5', name: 'ชัยวัฒน์ มั่นคง',  initials: 'ชว', email: 'chaiwat@scg.com',    color: '#DC2626', roles: { company: 'Requester'} },
  ]);

  uniqueModes = () => new Set(this.services().map(s => s.mode)).size;

  ngOnInit() {
    if (this.apiMode.isReal()) this.loadReal();
  }

  private loadReal() {
    this.loading.set(true);
    this.apiError.set(null);

    this.demoCtx.bootstrap().pipe(
      switchMap(ctx => forkJoin({
        codexApps: this.dataApi.getApps(),
        apps:      this.dataApi.getCompanyApps(ctx.companyId),
        members:   this.dataApi.getMembers(ctx.companyId),
        ctx:       of(ctx),
      }))
    ).subscribe({
      next: ({ codexApps, apps, members, ctx }) => {
        this.companyName.set(ctx.companyNameTH || 'บริษัท');

        const appList = (apps as ApiCompanyApp[]).filter(a => a.isActive);
        this.services.set(appList.map(a => {
          const info = (codexApps as ApiApp[]).find(c => c.id === a.applicationId);
          return {
            id:   a.applicationId,
            icon: ICONS[info?.appCode?.toUpperCase() ?? ''] || '📦',
            name: info?.appName ?? a.applicationId.slice(0, 6),
            code: info?.appCode?.toUpperCase() ?? a.applicationId.slice(0, 6),
            mode: 'multiple_user',
          };
        }));

        this.members.set((members as ApiMember[]).map((m, i) => ({
          id:       m.userId,
          name:     m.fullName || m.displayName || m.email,
          initials: (m.fullName || m.email).slice(0, 2),
          email:    m.email,
          color:    COLORS[i % COLORS.length],
          roles:    { company: m.role },
        })));

        this.loading.set(false);
      },
      error: err => {
        this.apiError.set(`Error ${err?.status}`);
        this.loading.set(false);
      },
    });
  }
}
