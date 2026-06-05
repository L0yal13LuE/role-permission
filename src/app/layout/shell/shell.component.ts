import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserServiceApi } from '../../core/services/user-service.service';
import { ToastComponent } from '../../shared/toast/toast.component';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <div class="app-shell">
      <!-- SIDEBAR -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sb-logo">
          <div class="sb-logo-inner">
            <div class="sb-logo-icon">AX</div>
            <div>
              <div class="sb-logo-name">APEX</div>
              <div class="sb-logo-tag">Role &amp; Permission</div>
            </div>
          </div>
        </div>

        <nav class="sb-nav">
          <div class="sb-label">Overview</div>
          @for (item of overviewNav; track item.route) {
            <a class="nav-btn" [routerLink]="item.route" routerLinkActive="active" (click)="closeSidebar()">
              <span class="ni">{{ item.icon }}</span> {{ item.label }}
            </a>
          }

          <div class="sb-label" style="margin-top:8px">Admin</div>
          @for (item of adminNav; track item.route) {
            <a class="nav-btn" [routerLink]="item.route" routerLinkActive="active" (click)="closeSidebar()">
              <span class="ni">{{ item.icon }}</span> {{ item.label }}
            </a>
          }
        </nav>

        <div class="sb-footer">
          <div class="sb-mode-toggle" (click)="toggleMockMode()">
            <div class="toggle-wrap">
              <div class="toggle-track" [class.on]="api.useMock">
                <div class="toggle-thumb"></div>
              </div>
              <span class="toggle-label" style="font-size:11px;color:var(--slate-400)">
                {{ api.useMock ? '🧪 Mock Mode' : '🌐 Real API' }}
              </span>
            </div>
          </div>
          <div class="sb-user">
            <div class="sb-user-role">Logged in as</div>
            <div class="sb-user-name">Admin User</div>
            <div class="sb-user-co">APEX Platform</div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-btn" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
          </div>
          <div class="topbar-right">
            <div class="mock-badge" [class.active]="api.useMock">
              {{ api.useMock ? '🧪 Mock' : '🌐 API' }}
            </div>
            <div class="avatar-sm" style="background:var(--orange)">AD</div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast />
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; }

    .sidebar {
      width: var(--sidebar-w);
      background: var(--navy);
      min-height: 100vh;
      position: fixed; left: 0; top: 0; bottom: 0;
      z-index: 100;
      display: flex; flex-direction: column;
      transition: transform .3s;
    }

    .sb-logo {
      padding: 18px 16px 14px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    .sb-logo-inner { display: flex; align-items: center; gap: 9px; }
    .sb-logo-icon {
      width: 34px; height: 34px; background: var(--orange); border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #fff; font-size: 14px; letter-spacing: -1px; flex-shrink: 0;
    }
    .sb-logo-name { color: #fff; font-weight: 700; font-size: 15px; letter-spacing: -.3px; }
    .sb-logo-tag  { color: var(--slate-400); font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; margin-top: 1px; }

    .sb-nav { padding: 8px 10px; flex: 1; overflow-y: auto; }
    .sb-label {
      font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: var(--slate-500); padding: 10px 8px 5px;
    }
    .nav-btn {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 7px;
      cursor: pointer; color: var(--slate-400); font-size: 12.5px; font-weight: 500;
      transition: all .15s; margin-bottom: 2px;
      text-decoration: none; width: 100%;
      &:hover { color: #fff; background: rgba(255,255,255,.07); }
      &.active { color: #fff; background: rgba(249,115,22,.18); border-left: 3px solid var(--orange); padding-left: 7px; }
    }
    .ni { font-size: 15px; flex-shrink: 0; }

    .sb-footer { padding: 10px; }
    .sb-mode-toggle {
      padding: 8px 10px; border-radius: 8px;
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      cursor: pointer; margin-bottom: 8px;
      &:hover { background: rgba(255,255,255,.08); }
    }
    .sb-user {
      padding: 10px 12px; border-radius: 9px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
    }
    .sb-user-role { font-size: 9.5px; color: var(--slate-500); text-transform: uppercase; letter-spacing: .5px; }
    .sb-user-name { color: var(--orange); font-weight: 700; font-size: 12px; margin-top: 2px; }
    .sb-user-co   { color: #fff; font-size: 11.5px; font-weight: 500; }

    .main-area { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

    .topbar {
      background: var(--white); border-bottom: 1px solid var(--slate-200);
      padding: 0 24px; height: 52px;
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
    }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .menu-btn {
      display: none; background: transparent; border: none; cursor: pointer;
      font-size: 18px; color: var(--slate-600); padding: 4px;
    }
    .mock-badge {
      padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
      background: var(--slate-100); color: var(--slate-500); border: 1px solid var(--slate-200);
      &.active { background: var(--orange-bg); color: var(--orange-dk); border-color: var(--orange-border); }
    }

    .content-area { padding: 24px; flex: 1; animation: fadeUp .25s ease; }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); &.open { transform: translateX(0); } }
      .main-area { margin-left: 0; }
      .menu-btn { display: block; }
      .content-area { padding: 16px; }
    }
  `],
})
export class ShellComponent {
  api = inject(UserServiceApi);
  sidebarOpen = signal(false);

  overviewNav: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
  ];

  adminNav: NavItem[] = [
    { label: 'Applications', icon: '🚀', route: '/applications' },
    { label: 'Roles', icon: '🛡', route: '/roles' },
    { label: 'Permissions', icon: '🔑', route: '/permissions' },
    { label: 'Companies', icon: '🏢', route: '/companies' },
    { label: 'Users', icon: '👥', route: '/users' },
    { label: 'Enrollments', icon: '📋', route: '/enrollments' },
  ];

  closeSidebar() { this.sidebarOpen.set(false); }

  toggleMockMode() {
    this.api.useMock = !this.api.useMock;
  }
}
