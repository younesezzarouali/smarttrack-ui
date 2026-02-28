import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface Habit {
  id: string;
  name: string;
  type: 'TIME' | 'COUNT' | 'BOOLEAN';
  targetValue: number;
  unit: string;
  category: string;
  streak: number;
  lastCompletedDate: string;
  active: boolean;
}

export interface HabitProgress {
  userId: string;
  date: string;
  progressMap: Record<string, number>;
  completedIds: string[];
}

@Injectable({ providedIn: 'root' })
export class HabitService {
  private apiUrl = `${environment.apiUrl}/habits`;
  
  private habitsSignal = signal<Habit[]>([]);
  private progressSignal = signal<HabitProgress | null>(null);

  readonly habits = computed(() => this.habitsSignal().filter(h => h.active));
  readonly progress = computed(() => this.progressSignal());

  constructor(private http: HttpClient) {}

  fetchHabits(): void {
    this.http.get<Habit[]>(this.apiUrl + '/active').subscribe({
        next: (habits) => {
            this.habitsSignal.set(habits || []);
            // After habits, fetch progress
            this.fetchProgress();
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

  getHabitProgress(habitId: string): number {
    return this.progressSignal()?.progressMap?.[habitId] || 0;
  }

  getHabitPercentage(habit: Habit): number {
    const current = this.getHabitProgress(habit.id);
    return Math.min((current / habit.targetValue) * 100, 100);
  }
}
