import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
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
      tap(() => this.fetchBriefing()) // Refresh briefing after input
    );
  }

  saveEvents(events: LifeEvent[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/events/batch`, events).pipe(
      tap(() => {
        this.fetchAll();
        this.fetchBriefing();
      })
    );
  }

  updateEvent(event: LifeEvent): Observable<LifeEvent> {
    return this.http.put<LifeEvent>(`${this.apiUrl}/events`, event).pipe(
      tap(() => {
        this.fetchAll();
        this.fetchBriefing();
      })
    );
  }

  fetchBriefing(): void {
    this.http.get<{briefing: string}>(`${this.apiUrl}/briefing`).subscribe({
      next: (res) => this.briefing.set(res.briefing),
      error: (err) => console.error('Briefing failed', err)
    });
  }

  fetchAll(): void {
    this.http.get<LifeEvent[]>(`${this.apiUrl}/events`).subscribe({
      next: (data) => this.eventsSignal.set(data),
      error: (err) => console.error('Failed to sync events', err)
    });
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
