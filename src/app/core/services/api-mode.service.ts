import { Injectable, signal, computed } from '@angular/core';

export type ApiMode = 'mock' | 'real';

@Injectable({ providedIn: 'root' })
export class ApiModeService {
  private readonly STORAGE_KEY = 'rp_api_mode';

  readonly mode = signal<ApiMode>(
    (sessionStorage.getItem(this.STORAGE_KEY) as ApiMode) ?? 'mock'
  );

  readonly isMock = computed(() => this.mode() === 'mock');
  readonly isReal = computed(() => this.mode() === 'real');

  toggle() {
    const next: ApiMode = this.mode() === 'mock' ? 'real' : 'mock';
    this.mode.set(next);
    sessionStorage.setItem(this.STORAGE_KEY, next);
  }
}
