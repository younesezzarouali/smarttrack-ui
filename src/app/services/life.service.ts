import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap, forkJoin } from 'rxjs';
import { environment } from '../environments/environment';

export type LifeEventType = 'FINANCE' | 'HEALTH' | 'WORK' | 'HABIT' | 'NOTE';

export interface LifeEvent {
  userId: string;
  timestamp: number;
  type: LifeEventType;
  content: string;
  payload: any;
}

export interface MagicResponse {
  intent: 'CAPTURE' | 'ANALYSE';
  answer?: string;
  events?: LifeEvent[];
}

@Injectable({ providedIn: 'root' })
export class LifeService {
  private apiUrl = `${environment.apiUrl}/life`;
  
  private eventsSignal = signal<LifeEvent[]>([]);
  readonly briefing = signal<string>('');

  readonly events = computed(() => [...this.eventsSignal()].sort((a, b) => b.timestamp - a.timestamp));
  readonly financeEvents = computed(() => this.eventsSignal().filter(e => e.type === 'FINANCE'));

  constructor(private http: HttpClient) {}

  interact(text: string): Observable<MagicResponse> {
    return this.http.post<MagicResponse>(`${this.apiUrl}/magic`, { text }).pipe(
      tap(() => this.fetchBriefing())
    );
  }

  saveEvents(events: LifeEvent[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/events/batch`, events).pipe(
      tap(() => this.sync()) // Optimize: single sync call
    );
  }

  updateEvent(event: LifeEvent): Observable<LifeEvent> {
    return this.http.put<LifeEvent>(`${this.apiUrl}/events`, event).pipe(
      tap(() => this.sync())
    );
  }

  deleteEvent(timestamp: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${timestamp}`).pipe(
      tap(() => this.sync())
    );
  }

  /**
   * OPTIMIZATION: Sync all data in parallel
   */
  sync(): void {
    const offset = new Date().getTimezoneOffset();
    const params = new HttpParams().set('timezoneOffset', offset.toString());

    // Execute requests in parallel
    forkJoin({
      events: this.http.get<LifeEvent[]>(`${this.apiUrl}/events`),
      briefing: this.http.get<{briefing: string}>(`${this.apiUrl}/briefing`, { params })
    }).subscribe({
      next: (res) => {
        this.eventsSignal.set(res.events);
        this.briefing.set(res.briefing.briefing);
      },
      error: (err) => console.error('Sync failed', err)
    });
  }

  // Helper for separate calls if needed
  fetchBriefing(): void {
    const offset = new Date().getTimezoneOffset();
    const params = new HttpParams().set('timezoneOffset', offset.toString());
    this.http.get<{briefing: string}>(`${this.apiUrl}/briefing`, { params }).subscribe(res => this.briefing.set(res.briefing));
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events`).pipe(
      tap(() => {
        this.eventsSignal.set([]);
        this.briefing.set('');
      })
    );
  }
}
