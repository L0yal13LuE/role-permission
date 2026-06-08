import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiModeService } from '../../../core/services/api-mode.service';
import { DemoContextService } from '../../../core/services/demo-context.service';
import { DemoDataService, ApiApp } from '../../../core/services/demo-data.service';
import { switchMap, forkJoin, of, Observable } from 'rxjs';

type ApprovalType = 'single' | 'multiple';
interface Svc     { id: string; apiId: string; icon: string; name: string; code: string; }
interface OBMember { id: string; name: string; initials: string; email: string; color: string; roles: Record<string, string>; }

const ICON_MAP: Record<string, string> = { FX: '💱', TBP: '🏦', ECI: '🛡️' };

const MOCK_SERVICES: Svc[] = [
  { id: 'fx',  apiId: '', icon: '💱', name: 'FX Forward Contract', code: 'FX'  },
  { id: 'tbp', apiId: '', icon: '🏦', name: 'TBP สินเชื่อ',        code: 'TBP' },
  { id: 'eci', apiId: '', icon: '🛡️', name: 'ECI ประกันการส่งออก', code: 'ECI' },
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sec-hd">
      <div class="sh">Onboarding Service</div>
      <div class="ss">ลงทะเบียนใช้ service และกำหนด role ให้ทีม</div>
    </div>

    @if (apiError()) {
      <div class="alert alert-red" style="margin-bottom:16px">⚠️ {{ apiError() }}</div>
    }

    <!-- Stepper -->
    <div class="stepper" style="margin-bottom:24px">
      @for (s of steps; track s.n; let i = $index) {
        <div class="step" [class.active]="step() === s.n" [class.done]="step() > s.n">
          <div class="step-dot">{{ step() > s.n ? '✓' : s.n }}</div>
          <div class="step-label">{{ s.label }}</div>
        </div>
        @if (i < steps.length - 1) { <div class="step-line" [class.done]="step() > s.n + 1"></div> }
      }
    </div>

    @if (done()) {
      <div class="card" style="text-align:center;padding:48px 24px">
        <div style="font-size:48px;margin-bottom:16px">🎉</div>
        <div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:8px">Onboarding สำเร็จ!</div>
        <div style="font-size:13px;color:#64748B;margin-bottom:24px">
          ลงทะเบียน {{ selectedSvcs().length }} services เรียบร้อยแล้ว
        </div>
        <button class="btn btn-primary" (click)="router.navigate(['/customer/dashboard'])">ไปยัง Dashboard →</button>
      </div>
    } @else {

      @if (step() === 1) {
        <div class="card">
          <div class="card-hd">
            <div class="card-title">เลือก Service ที่ต้องการ</div>
            @if (loading()) { <span style="font-size:12px;color:#64748B">⏳ กำลังโหลด...</span> }
          </div>
          <div class="card-body">
            <div class="g3">
              @for (svc of allServices(); track svc.id) {
                <div class="svc-pick" [class.selected]="isSelected(svc.id)" (click)="toggleSvc(svc.id)">
                  <div class="svc-pick-check">{{ isSelected(svc.id) ? '✓' : '' }}</div>
                  <div style="font-size:28px;margin-bottom:8px">{{ svc.icon }}</div>
                  <div style="font-weight:700;font-size:13px">{{ svc.name }}</div>
                  <div class="mono" style="font-size:11px;color:#64748B;margin-top:2px">{{ svc.code }}</div>
                </div>
              }
            </div>
          </div>
        </div>
        <div class="step-actions">
          <span></span>
          <button class="btn btn-primary" [disabled]="selectedSvcs().length === 0" (click)="next()">
            ถัดไป → ({{ selectedSvcs().length }} service)
          </button>
        </div>
      }

      @if (step() === 2) {
        <div class="card">
          <div class="card-hd"><div class="card-title">เลือกรูปแบบอนุมัติ</div></div>
          <div class="card-body">
            @for (svcId of selectedSvcs(); track svcId) {
              <div style="margin-bottom:20px">
                <div style="font-weight:700;font-size:13px;margin-bottom:10px">
                  {{ svcIcon(svcId) }} {{ svcName(svcId) }}
                </div>
                <div class="g2">
                  <label class="approval-pick" [class.selected]="approvalTypes()[svcId] === 'single'" (click)="setApproval(svcId, 'single')">
                    <div class="approval-radio">{{ approvalTypes()[svcId] === 'single' ? '●' : '○' }}</div>
                    <div>
                      <div style="font-weight:700;font-size:12.5px">Single User</div>
                      <div style="font-size:11.5px;color:#64748B">1 คนทำรายการและอนุมัติเอง</div>
                    </div>
                  </label>
                  <label class="approval-pick" [class.selected]="approvalTypes()[svcId] === 'multiple'" (click)="setApproval(svcId, 'multiple')">
                    <div class="approval-radio">{{ approvalTypes()[svcId] === 'multiple' ? '●' : '○' }}</div>
                    <div>
                      <div style="font-weight:700;font-size:12.5px">Multiple User</div>
                      <div style="font-size:11.5px;color:#64748B">มี workflow Maker → Approver</div>
                    </div>
                  </label>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="step-actions">
          <button class="btn btn-outline" (click)="step.set(1)">← ย้อนกลับ</button>
          <button class="btn btn-primary" [disabled]="!allApprovalSet()" (click)="next()">ถัดไป →</button>
        </div>
      }

      @if (step() === 3) {
        <div class="card">
          <div class="card-hd">
            <div class="card-title">กำหนด Role ให้สมาชิก</div>
            <button class="btn btn-outline btn-sm" (click)="addOBMember()" [disabled]="obMembers().length >= 10">＋ เพิ่ม</button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>สมาชิก</th>
                  <th>Email</th>
                  @for (svcId of selectedSvcs(); track svcId) {
                    <th style="min-width:130px">
                      {{ svcIcon(svcId) }} {{ svcId.toUpperCase() }}
                      <span class="badge" [class]="approvalTypes()[svcId] === 'single' ? 'b-single' : 'b-multiple'" style="font-size:9px;margin-left:3px">
                        {{ approvalTypes()[svcId] }}
                      </span>
                    </th>
                  }
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of obMembers(); track m.id) {
                  <tr>
                    <td style="font-weight:600">{{ m.name }}</td>
                    <td style="color:#64748B;font-size:12px">{{ m.email }}</td>
                    @for (svcId of selectedSvcs(); track svcId) {
                      <td>
                        <select class="form-input" style="padding:5px 8px;font-size:12px" [(ngModel)]="m.roles[svcId]">
                          @for (r of roleOptions(svcId); track r) { <option [value]="r">{{ r }}</option> }
                        </select>
                      </td>
                    }
                    <td><button class="btn btn-danger btn-sm" (click)="removeOBMember(m.id)">✕</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <div class="step-actions">
          <button class="btn btn-outline" (click)="step.set(2)">← ย้อนกลับ</button>
          <button class="btn btn-primary" [disabled]="!allRolesSet() || submitting()" (click)="submit()">
            {{ submitting() ? '⏳ กำลัง Submit...' : '✅ ยืนยัน Onboarding' }}
          </button>
        </div>
      }
    }
  `,
  styles: [`
    .stepper { display: flex; align-items: center; gap: 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .step-dot {
      width: 30px; height: 30px; border-radius: 50%;
      background: #E2E8F0; color: #64748B; font-weight: 700; font-size: 12px;
      display: flex; align-items: center; justify-content: center; transition: all .2s;
    }
    .step.active .step-dot { background: #034EA1; color: #fff; }
    .step.done  .step-dot { background: #059669; color: #fff; }
    .step-label { font-size: 11px; color: #64748B; white-space: nowrap; }
    .step.active .step-label { color: #034EA1; font-weight: 700; }
    .step-line { flex: 1; height: 2px; background: #E2E8F0; min-width: 40px; &.done { background: #059669; } }
    .svc-pick {
      border: 2px solid #E2E8F0; border-radius: 10px; padding: 20px;
      cursor: pointer; transition: all .2s; text-align: center; position: relative;
      &:hover { border-color: #034EA1; background: #EBF2FC; }
      &.selected { border-color: #034EA1; background: #EBF2FC; }
    }
    .svc-pick-check {
      position: absolute; top: 8px; right: 8px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #034EA1; color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .svc-pick:not(.selected) .svc-pick-check { background: transparent; }
    .approval-pick {
      border: 2px solid #E2E8F0; border-radius: 8px; padding: 12px;
      cursor: pointer; display: flex; align-items: flex-start; gap: 10px;
      &.selected { border-color: #034EA1; background: #EBF2FC; }
    }
    .approval-radio { font-size: 16px; color: #034EA1; flex-shrink: 0; margin-top: 1px; }
    .step-actions { display: flex; justify-content: space-between; margin-top: 16px; }
  `],
})
export class OnboardingComponent implements OnInit {
  constructor(public router: Router) {}

  private apiMode  = inject(ApiModeService);
  private demoCtx  = inject(DemoContextService);
  private dataApi  = inject(DemoDataService);

  readonly steps = [
    { n: 1, label: 'เลือก Service' },
    { n: 2, label: 'Approval Type' },
    { n: 3, label: 'กำหนด Role' },
  ];

  step          = signal(1);
  done          = signal(false);
  loading       = signal(false);
  submitting    = signal(false);
  apiError      = signal<string | null>(null);
  selectedSvcs  = signal<string[]>([]);
  approvalTypes = signal<Record<string, ApprovalType>>({});
  allServices   = signal<Svc[]>(MOCK_SERVICES);

  private counter = 1;
  obMembers = signal<OBMember[]>([
    { id: 'ob1', name: 'ธีรพงศ์ สุขดี', initials: 'ธร', email: 'teeraphong@scg.com', color: '#034EA1', roles: {} },
    { id: 'ob2', name: 'สมชาย ใจดี',   initials: 'สช', email: 'somchai@scg.com',    color: '#059669', roles: {} },
  ]);

  isSelected     = (id: string)  => this.selectedSvcs().includes(id);
  svcName        = (id: string)  => this.allServices().find(s => s.id === id)?.name ?? id;
  svcIcon        = (id: string)  => this.allServices().find(s => s.id === id)?.icon ?? '';
  allApprovalSet = ()            => this.selectedSvcs().every(id => !!this.approvalTypes()[id]);
  allRolesSet    = ()            => this.obMembers().every(m => this.selectedSvcs().every(s => !!m.roles[s]));

  ngOnInit() {
    if (this.apiMode.isReal()) this.loadApps();
  }

  private loadApps() {
    this.loading.set(true);
    this.demoCtx.bootstrap().pipe(
      switchMap(() => this.dataApi.getApps())
    ).subscribe({
      next: (apps: ApiApp[]) => {
        this.allServices.set(apps.filter(a => a.isActive).map(a => ({
          id:    a.appCode?.toLowerCase() ?? a.id,
          apiId: a.id,
          icon:  ICON_MAP[a.appCode?.toUpperCase() ?? ''] ?? '📦',
          name:  a.nameTH || a.nameEN,
          code:  a.appCode?.toUpperCase() ?? a.id.slice(0, 6),
        })));
        this.loading.set(false);
      },
      error: err => {
        this.apiError.set(`Load apps error: ${err?.status}`);
        this.loading.set(false);
      },
    });
  }

  roleOptions(svcId: string): string[] {
    const at = this.approvalTypes()[svcId];
    return at === 'single' ? ['Data Entry', 'Viewer'] : ['Admin', 'Maker', 'Approver', 'Viewer', 'Requester'];
  }

  toggleSvc(id: string) {
    this.selectedSvcs.update(list =>
      list.includes(id) ? list.filter(s => s !== id) : [...list, id]
    );
  }

  setApproval(svcId: string, type: ApprovalType) {
    this.approvalTypes.update(m => ({ ...m, [svcId]: type }));
  }

  next() { this.step.update(s => s + 1); }

  addOBMember() {
    this.obMembers.update(list => [...list, {
      id: `ob${++this.counter}`, name: 'สมาชิกใหม่', initials: 'ให',
      email: '', color: '#64748B', roles: {},
    }]);
  }

  removeOBMember(id: string) {
    this.obMembers.update(list => list.filter(m => m.id !== id));
  }

  submit() {
    if (!this.apiMode.isReal()) {
      this.done.set(true);
      return;
    }

    const ctx = this.demoCtx.ctx();
    if (!ctx) { this.done.set(true); return; }

    this.submitting.set(true);
    this.apiError.set(null);

    const companyId = ctx.companyId;

    // Subscribe selected apps
    const subscribeCalls: Observable<void>[] = this.selectedSvcs().map(svcLocalId => {
      const svc = this.allServices().find(s => s.id === svcLocalId);
      const apiId = (svc?.apiId || ctx.apps.find(a => a.code?.toUpperCase() === svcLocalId.toUpperCase())?.id) ?? '';
      return apiId ? this.dataApi.subscribeToApp(companyId, apiId) : of(undefined as void);
    });

    forkJoin(subscribeCalls).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
      },
      error: err => {
        this.apiError.set(`Onboarding error: ${err?.status}`);
        this.submitting.set(false);
      },
    });
  }
}
