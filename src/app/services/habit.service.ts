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
  private apiUrl = `${environment.apiUrl}/life/habits`;
  
  private habitsSignal = signal<Habit[]>([]);
  private progressSignal = signal<HabitProgress | null>(null);

  readonly habits = computed(() => this.habitsSignal().filter(h => h.active));
  readonly progress = computed(() => this.progressSignal());

  constructor(private http: HttpClient) {}

  fetchHabits(): void {
    this.http.get<{habits: Habit[], progress: any}>(this.apiUrl).subscribe(res => {
      this.habitsSignal.set(res.habits);
      this.progressSignal.set(res.progress.progressMap ? res.progress : null);
    });
  }

  getHabitProgress(habitId: string): number {
    return this.progressSignal()?.progressMap?.[habitId] || 0;
  }

  getHabitPercentage(habit: Habit): number {
    const current = this.getHabitProgress(habit.id);
    return Math.min((current / habit.targetValue) * 100, 100);
  }
}
