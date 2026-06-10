import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ViewModeService } from '../../core/services/view-mode.service';
import { ApiModeService } from '../../core/services/api-mode.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sb-logo">
          <div class="sb-logo-inner">
            <div class="sb-logo-icon">RP</div>
            <div>
              <div class="sb-logo-name">Role & Permission</div>
              <div class="sb-logo-tag">Demo Platform</div>
            </div>
          </div>
        </div>

        <nav class="sb-nav">
          <div class="sb-label">{{ view.isEmployee() ? 'Admin Portal' : 'Super App' }}</div>
          @for (item of currentNav(); track item.route) {
            <a class="nav-btn" [routerLink]="item.route" routerLinkActive="active">
              <span class="ni">{{ item.icon }}</span> {{ item.label }}
            </a>
          }
          <div class="sb-label" style="margin-top:12px">Reference</div>
          <a class="nav-btn" routerLink="/shared/db-schema" routerLinkActive="active">
            <span class="ni">📐</span> DB Schema
          </a>
        </nav>

        <div class="sb-footer">
          <div class="sb-user">
            <div class="sb-user-role">{{ view.isEmployee() ? 'Employee' : 'Customer (ตัวแทน)' }}</div>
            <div class="sb-user-name">{{ view.isEmployee() ? 'Admin User' : 'คุณธีรพงศ์ (SCG)' }}</div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <span class="topbar-title">APEX Demo</span>
          </div>
          <div class="topbar-right">
            <!-- View Toggle -->
            <div class="pill-toggle">
              <button class="pill-btn" [class.active]="view.isEmployee()" (click)="switchView('employee')">
                🏢 Employee
              </button>
              <button class="pill-btn" [class.active]="view.isCustomer()" (click)="switchView('customer')">
                👤 Customer
              </button>
            </div>

            <!-- API Mode Toggle -->
            <div class="mode-pill" [class.real]="api.isReal()" (click)="api.toggle()" title="Toggle Mock/Real API">
              <div class="mode-dot"></div>
              {{ api.isMock() ? '🧪 Mock' : '🌐 Real' }}
            </div>

            <div class="avatar-sm">AD</div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; }

    /* ── SIDEBAR ── */
    .sidebar {
      width: 240px; background: #0F172A;
      min-height: 100vh; position: fixed; left: 0; top: 0; bottom: 0;
      z-index: 100; display: flex; flex-direction: column;
    }
    .sb-logo {
      padding: 16px 14px 12px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    .sb-logo-inner { display: flex; align-items: center; gap: 9px; }
    .sb-logo-icon {
      width: 32px; height: 32px; background: #034EA1; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff; font-size: 11px; flex-shrink: 0;
    }
    .sb-logo-name { color: #fff; font-weight: 700; font-size: 13px; }
    .sb-logo-tag  { color: #64748B; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; }

    .sb-nav { padding: 8px 10px; flex: 1; overflow-y: auto; }
    .sb-label {
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #475569; padding: 10px 8px 5px;
    }
    .nav-btn {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 7px; cursor: pointer;
      color: #94A3B8; font-size: 12.5px; font-weight: 500;
      transition: all .15s; margin-bottom: 2px;
      text-decoration: none; width: 100%;
      &:hover { color: #fff; background: rgba(255,255,255,.07); }
      &.active { color: #fff; background: rgba(3,78,161,.25); border-left: 3px solid #034EA1; padding-left: 7px; }
    }
    .ni { font-size: 14px; flex-shrink: 0; }

    .sb-footer { padding: 10px; }
    .sb-user {
      padding: 10px 12px; border-radius: 8px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    }
    .sb-user-role { font-size: 9px; color: #475569; text-transform: uppercase; letter-spacing: .5px; }
    .sb-user-name { color: #93C5FD; font-weight: 700; font-size: 12px; margin-top: 2px; }

    /* ── MAIN ── */
    .main-area { margin-left: 240px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

    .topbar {
      background: #fff; border-bottom: 1px solid #E2E8F0;
      padding: 0 20px; height: 54px;
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 3px rgba(0,0,0,.05);
    }
    .topbar-title { font-size: 14px; font-weight: 700; color: #0F172A; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }

    /* View pill toggle */
    .pill-toggle {
      display: flex; background: #F1F5F9; border-radius: 8px; padding: 3px; gap: 2px;
    }
    .pill-btn {
      padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600; background: transparent; color: #64748B;
      transition: all .15s; font-family: inherit;
      &.active { background: #034EA1; color: #fff; box-shadow: 0 1px 3px rgba(3,78,161,.3); }
      &:not(.active):hover { background: rgba(3,78,161,.08); color: #034EA1; }
    }

    /* API mode pill */
    .mode-pill {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 10px; border-radius: 99px; cursor: pointer;
      font-size: 11.5px; font-weight: 700; transition: all .15s;
      background: #F1F5F9; color: #64748B; border: 1px solid #E2E8F0;
      &.real { background: #EBF2FC; color: #034EA1; border-color: #BFDBFE; }
      &:hover { opacity: .85; }
    }
    .mode-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #94A3B8;
      .real & { background: #034EA1; }
    }

    .avatar-sm {
      width: 30px; height: 30px; border-radius: 50%; background: #034EA1;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #fff;
    }

    .content-area { padding: 24px; flex: 1; animation: fadeUp .2s ease; }
  `],
})
export class ShellComponent {
  view = inject(ViewModeService);
  api  = inject(ApiModeService);
  router = inject(Router);

  private employeeNav: NavItem[] = [
    { label: 'Modes',           icon: '🗂️',  route: '/employee/modes' },
    { label: 'Service Config',  icon: '⚙️',  route: '/employee/service-config' },
    { label: 'Mode Config',     icon: '🔧',  route: '/employee/mode-config' },
    { label: 'Role Builder',    icon: '🛡️',  route: '/employee/role-builder' },
    { label: 'Companies',       icon: '🏢',  route: '/employee/companies' },
  ];

  private customerNav: NavItem[] = [
    { label: 'Dashboard',  icon: '📊', route: '/customer/dashboard' },
    { label: 'Onboarding', icon: '🚀', route: '/customer/onboarding' },
    { label: 'Team',       icon: '👥', route: '/customer/team' },
  ];

  currentNav = computed(() =>
    this.view.isEmployee() ? this.employeeNav : this.customerNav
  );

  switchView(mode: 'employee' | 'customer') {
    this.view.set(mode);
    this.router.navigate([this.view.defaultRoute()]);
  }
}
