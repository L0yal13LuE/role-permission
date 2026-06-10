import { Injectable, signal, computed } from '@angular/core';

export type ViewMode = 'employee' | 'customer';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private readonly STORAGE_KEY = 'rp_view_mode';

  readonly mode = signal<ViewMode>(
    (sessionStorage.getItem(this.STORAGE_KEY) as ViewMode) ?? 'employee'
  );

  readonly isEmployee = computed(() => this.mode() === 'employee');
  readonly isCustomer = computed(() => this.mode() === 'customer');

  readonly defaultRoute = computed(() =>
    this.mode() === 'employee' ? '/employee/service-config' : '/customer/dashboard'
  );

  set(mode: ViewMode) {
    this.mode.set(mode);
    sessionStorage.setItem(this.STORAGE_KEY, mode);
  }

  toggle() {
    this.set(this.mode() === 'employee' ? 'customer' : 'employee');
  }
}
