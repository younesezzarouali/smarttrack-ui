import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal, inject } from '@angular/core';
import { Observable, tap, forkJoin } from 'rxjs';
import { environment } from '../environments/environment';
import { HabitService } from './habit.service';

export type LifeEventType = 'FINANCE' | 'HEALTH' | 'WORK' | 'HABIT' | 'NOTE';

export interface LifeEvent {
  userId: string;
  timestamp: number;
  type: LifeEventType;
  content: string;
  fullDescription: string;
  payload: any;
}

export interface MagicResponse {
  intent: 'CAPTURE' | 'ANALYSE';
  dailyInsight?: string;
  answer?: string;
  events?: LifeEvent[];
  habitUpdates?: any[];
  habitCreations?: any[];
}

@Injectable({ providedIn: 'root' })
export class LifeService {
  private apiUrl = `${environment.apiUrl}/life`;
  private habitService = inject(HabitService);
  
  readonly activeTab = signal<'journal' | 'habits'>('journal');
  
  private eventsSignal = signal<LifeEvent[]>([]);
  readonly briefing = signal<string>('');

  readonly events = computed(() => [...this.eventsSignal()].sort((a, b) => b.timestamp - a.timestamp));
  readonly financeEvents = computed(() => this.eventsSignal().filter(e => e.type === 'FINANCE'));

  constructor(private http: HttpClient) {
    const savedTab = localStorage.getItem('activeTab') as 'journal' | 'habits';
    if (savedTab) this.activeTab.set(savedTab);
  }

  setTab(tab: 'journal' | 'habits') {
    this.activeTab.set(tab);
    localStorage.setItem('activeTab', tab);
  }

  interact(text: string): Observable<MagicResponse> {
    return this.http.post<MagicResponse>(`${this.apiUrl}/magic`, { text });
  }

  sync(): void {
    const offset = new Date().getTimezoneOffset();
    const params = new HttpParams().set('timezoneOffset', offset.toString());

    forkJoin({
      events: this.http.get<LifeEvent[]>(`${this.apiUrl}/events`),
      briefing: this.http.get<{briefing: string}>(`${this.apiUrl}/briefing`, { params })
    }).subscribe({
      next: (res) => {
        this.eventsSignal.set(res.events);
        this.briefing.set(res.briefing.briefing);
        this.habitService.fetchHabits();
      },
      error: (err) => console.error('Sync failed', err)
    });
  }

  saveBatch(events: LifeEvent[]): Observable<void> {
    // Send list directly as expected by the backend
    return this.http.post<void>(`${this.apiUrl}/events/batch`, events).pipe(
      tap(() => this.sync())
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

  clearAll(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events`).pipe(
      tap(() => {
        this.eventsSignal.set([]);
        this.briefing.set('');
        this.habitService.fetchHabits();
      })
    );
  }
}
