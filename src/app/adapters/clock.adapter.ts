import { Injectable } from '@angular/core';
import { ClockPort } from '../core/ports/clock.port';

@Injectable({ providedIn: 'root' })
export class AngularClockAdapter implements ClockPort {
  now(): Date {
    return new Date();
  }
}
