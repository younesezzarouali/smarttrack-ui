import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { Habit, HabitProgress, WeeklySummary } from '../core/habits/habit-types';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private apiUrl = `${environment.apiUrl}/habits`;
  
  private habitsSignal = signal<Habit[]>([]);
  private progressSignal = signal<HabitProgress | null>(null);
  private weeklySummarySignal = signal<WeeklySummary | null>(null);

  readonly habits = computed(() => this.habitsSignal().filter(h => h.active));
  readonly progress = computed(() => this.progressSignal());
  readonly weeklySummary = computed(() => this.weeklySummarySignal());

  constructor(private http: HttpClient) {}

  fetchHabits(): void {
    this.http.get<Habit[]>(this.apiUrl + '/active').subscribe({
        next: (habits) => {
            this.habitsSignal.set(habits || []);
            this.fetchProgress();
            this.fetchWeeklySummary();
        },
        error: (err) => console.error('Habit fetch failed', err)
    });
  }

  fetchProgress(): void {
    this.http.get<HabitProgress>(this.apiUrl + '/progress/daily').subscribe({
      next: (prog) => this.progressSignal.set(prog),
      error: (err) => console.error('Progress fetch failed', err)
    });
  }

  fetchWeeklySummary(): void {
    this.http.get<WeeklySummary>(this.apiUrl + '/summary').subscribe({
      next: (summary) => this.weeklySummarySignal.set(summary),
      error: (err) => console.error('Summary fetch failed', err)
    });
  }

  createHabit(habit: any): Observable<any> {
    return this.http.post<Habit>(this.apiUrl, habit).pipe(
      tap(() => this.fetchHabits())
    );
  }

  deleteHabit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.fetchHabits())
    );
  }

  logHabitProgress(habitId: string, delta: number, source: string = 'manual'): Observable<Habit> {
    const payload = {
      date: new Date().toISOString().split('T')[0],
      delta: delta,
      unit: 'min',
      source: source
    };
    return this.http.post<Habit>(`${this.apiUrl}/${habitId}/log`, payload).pipe(
      tap(() => {
        this.fetchHabits();
        this.fetchProgress();
      })
    );
  }

  getHabitProgress(habitId: string): number {
    return this.progressSignal()?.progressMap?.[habitId] || 0;
  }

  getHabitPercentage(habit: Habit): number {
    const current = this.getHabitProgress(habit.id);
    return Math.min((current / habit.targetValue) * 100, 100);
  }
}
