import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ViewModeService } from '../../core/services/view-mode.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <div class="brand-icon">RP</div>
          <div>
            <div class="brand-name">APEX Platform</div>
            <div class="brand-sub">Role & Permission Demo</div>
          </div>
        </div>

        <p class="hint">เลือกมุมมองที่ต้องการ demo</p>

        <div class="role-pick" (click)="select('employee')">
          <div class="role-icon emp">🏢</div>
          <div class="role-info">
            <div class="role-title">Employee — Admin Portal</div>
            <div class="role-desc">กำหนด service, role, permission และจัดการ company</div>
          </div>
          <span class="arrow">›</span>
        </div>

        <div class="role-pick" (click)="select('customer')">
          <div class="role-icon cust">👤</div>
          <div class="role-info">
            <div class="role-title">Customer — Super App Platform</div>
            <div class="role-desc">Onboard service, กำหนด role ให้ team members</div>
          </div>
          <span class="arrow">›</span>
        </div>

        <p class="footer-note">🧪 เริ่มต้นด้วย Mock data — สลับ Real API ได้ใน Topbar</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(145deg, #0F172A 0%, #1a2a4a 50%, #0F172A 100%);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .login-card {
      background: #fff; border-radius: 16px; padding: 36px;
      width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .brand-icon {
      width: 44px; height: 44px; background: #034EA1; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff; font-size: 14px;
    }
    .brand-name { font-size: 18px; font-weight: 800; color: #0F172A; }
    .brand-sub  { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
    .hint { font-size: 13px; color: #64748B; margin-bottom: 16px; }
    .role-pick {
      border: 2px solid #E2E8F0; border-radius: 12px; padding: 16px;
      cursor: pointer; transition: all .2s; margin-bottom: 10px;
      display: flex; align-items: center; gap: 14px; background: #fff;
      &:hover {
        border-color: #034EA1; background: #EBF2FC;
        transform: translateY(-1px); box-shadow: 0 4px 16px rgba(3,78,161,.15);
      }
    }
    .role-icon {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
      &.emp  { background: #DBEAFE; }
      &.cust { background: #D1FAE5; }
    }
    .role-info { flex: 1; }
    .role-title { font-size: 13.5px; font-weight: 700; color: #0F172A; }
    .role-desc  { font-size: 11.5px; color: #64748B; margin-top: 3px; }
    .arrow { font-size: 20px; color: #CBD5E1; }
    .footer-note { margin-top: 20px; font-size: 11.5px; color: #94A3B8; text-align: center; }
  `],
})
export class LoginComponent {
  private view   = inject(ViewModeService);
  private router = inject(Router);

  select(mode: 'employee' | 'customer') {
    this.view.set(mode);
    this.router.navigate([this.view.defaultRoute()]);
  }
}
