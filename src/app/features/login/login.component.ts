import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-brand-icon">AX</div>
          <div>
            <div class="login-brand-name">APEX Platform</div>
            <div class="login-brand-sub">Role &amp; Permission Management</div>
          </div>
        </div>
        <div class="login-heading">เข้าสู่ระบบ</div>
        <div class="login-sub">ระบบจัดการ Role และ Permission สำหรับ Super App Platform</div>

        <div class="role-pick" (click)="login()">
          <div class="role-pick-icon org">⚙️</div>
          <div>
            <div class="role-pick-title">Admin</div>
            <div class="role-pick-desc">จัดการ Applications, Roles, Permissions และ Companies</div>
          </div>
          <div class="role-pick-arrow">›</div>
        </div>

        <div class="role-pick" (click)="login()">
          <div class="role-pick-icon co">🏢</div>
          <div>
            <div class="role-pick-title">Company Admin</div>
            <div class="role-pick-desc">จัดการ Enrollment, Users และ Role assignments ในบริษัท</div>
          </div>
          <div class="role-pick-arrow">›</div>
        </div>

        <div class="login-divider"></div>
        <div style="font-size:11.5px;color:var(--slate-400);text-align:center;line-height:1.6;">
          <span class="mock-badge-info">🧪 Mock Mode Active</span><br>
          สามารถ toggle ระหว่าง Mock และ Real API ได้จาก sidebar
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(145deg, #0F172A 0%, #1a2a4a 50%, #0F172A 100%);
      display: flex; align-items: center; justify-content: center; padding: 24px;
      position: relative; overflow: hidden;
      &::before {
        content: '';
        position: absolute; inset: 0;
        background-image:
          radial-gradient(circle at 20% 80%, rgba(249,115,22,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(249,115,22,0.05) 0%, transparent 50%);
        pointer-events: none;
      }
    }
    .login-card {
      background: var(--white); border-radius: 20px; padding: 40px;
      width: 100%; max-width: 440px; box-shadow: var(--sh-lg); position: relative; z-index: 1;
    }
    .login-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .login-brand-icon {
      width: 46px; height: 46px; background: var(--orange); border-radius: 13px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff; font-size: 18px; letter-spacing: -1px;
    }
    .login-brand-name { font-size: 20px; font-weight: 800; color: var(--navy); letter-spacing: -.5px; }
    .login-brand-sub  { font-size: 11px; color: var(--slate-400); margin-top: 1px; text-transform: uppercase; letter-spacing: .5px; }
    .login-heading { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
    .login-sub     { font-size: 12px; color: var(--slate-500); margin-bottom: 20px; }
    .role-pick {
      border: 2px solid var(--slate-200); border-radius: var(--r); padding: 16px;
      cursor: pointer; transition: all .2s; margin-bottom: 10px;
      display: flex; align-items: center; gap: 14px; background: var(--white);
      &:hover { border-color: var(--orange); background: var(--orange-bg); transform: translateY(-1px); box-shadow: var(--sh-md); }
    }
    .role-pick-icon {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
      &.org { background: var(--orange-muted); }
      &.co  { background: #EFF6FF; }
    }
    .role-pick-title { font-size: 13.5px; font-weight: 700; color: var(--navy); }
    .role-pick-desc  { font-size: 11.5px; color: var(--slate-500); margin-top: 2px; }
    .role-pick-arrow { margin-left: auto; color: var(--slate-300); font-size: 18px; }
    .login-divider   { border: none; border-top: 1px solid var(--slate-200); margin: 20px 0; }
    .mock-badge-info {
      display: inline-block; padding: 2px 10px; border-radius: 99px;
      background: var(--orange-bg); color: var(--orange-dk);
      border: 1px solid var(--orange-border); font-weight: 700;
    }
  `],
})
export class LoginComponent {
  private router = inject(Router);
  login() { this.router.navigate(['/dashboard']); }
}
