import { Injectable } from '@angular/core';
import { SchedulerPort } from '../core/ports/scheduler.port';

@Injectable({ providedIn: 'root' })
export class BrowserSchedulerAdapter implements SchedulerPort {
  private intervalId: any;

  start(onTick: () => void, intervalMs: number): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(onTick, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
