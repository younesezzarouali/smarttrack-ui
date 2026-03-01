import { Injectable, computed, inject, signal } from '@angular/core';
import { HabitService } from './habit.service';
import { LifeService } from './life.service';
import { Habit, HabitState } from '../core/habits/habit-types';
import { calculateHabitState, selectFocusHabitId, getNudgeMessageTemplate } from '../core/habits/habit-logic';
import { TimerController, TimerState } from '../core/timer/timer-controller';
import { AngularClockAdapter } from '../adapters/clock.adapter';
import { BrowserSchedulerAdapter } from '../adapters/scheduler.adapter';

@Injectable({ providedIn: 'root' })
export class HabitsMotivationService {
  private habitService = inject(HabitService);
  private lifeService = inject(LifeService);
  
  // Core Domain Controller
  private timerController: TimerController;

  // UI state signals (synchronized with core)
  readonly activeTimerHabitId = signal<string | null>(null);
  readonly timerSecondsRemaining = signal<number>(0);
  readonly isTimerRunning = signal<boolean>(false);
  readonly isMinimized = signal<boolean>(false);
  readonly justCompletedHabitId = signal<string | null>(null);
  readonly showStreakFire = signal<boolean>(false);
  readonly showIdentityNudge = signal<boolean>(false);
  
  private habitsCompletedTodayCount = 0;
  readonly now = signal(new Date());

  constructor(
    clock: AngularClockAdapter,
    scheduler: BrowserSchedulerAdapter
  ) {
    this.timerController = new TimerController(clock, scheduler);

    // Synchronize core timer state with UI signals
    this.timerController.onTick((state: TimerState) => {
      this.timerSecondsRemaining.set(state.remainingSeconds);
      this.isTimerRunning.set(state.status === 'RUNNING' || state.status === 'PAUSED');
      this.activeTimerHabitId.set(state.habitId);
    });

    this.timerController.onComplete((habitId: string) => {
      this.handleTimerCompletion(habitId);
    });

    // Update "now" every minute
    setInterval(() => this.now.set(new Date()), 60000);
  }

  getHabitState(habit: Habit): HabitState {
    const progress = this.habitService.getHabitProgress(habit.id);
    return calculateHabitState(habit, progress, this.now().getHours());
  }

  readonly habitStates = computed(() => {
    const states: Record<string, HabitState> = {};
    this.habitService.habits().forEach(h => {
      states[h.id] = this.getHabitState(h);
    });
    return states;
  });

  readonly focusHabitId = computed(() => {
    return selectFocusHabitId(this.habitService.habits(), this.habitStates());
  });

  readonly focusHabit = computed(() => {
    const id = this.focusHabitId();
    return id ? this.habitService.habits().find(h => h.id === id) : null;
  });

  // Timer Commands
  startTimer(habitId: string, durationMin: number = 5) {
    this.justCompletedHabitId.set(null);
    this.isMinimized.set(false);
    this.timerController.start(durationMin, habitId);
  }

  cancelTimer() {
    this.timerController.cancel();
    this.isMinimized.set(false);
  }

  minimizeTimer() {
    this.isMinimized.set(true);
  }

  private handleTimerCompletion(habitId: string) {
    const habit = this.habitService.habits().find(h => h.id === habitId);
    if (!habit) return;

    const oldStreak = habit.currentStreak;

    this.habitService.logHabitProgress(habitId, 5, 'timer').subscribe({
      next: (updatedHabit) => {
        this.justCompletedHabitId.set(habitId);
        
        // A) Micro success feedback (1.5s)
        setTimeout(() => this.justCompletedHabitId.set(null), 1500);

        // B) Streak reinforcement
        if (updatedHabit && updatedHabit.currentStreak > oldStreak) {
          this.showStreakFire.set(true);
          setTimeout(() => this.showStreakFire.set(false), 2000);
        }

        // C) Identity reinforcement
        if (this.habitsCompletedTodayCount === 0) {
          this.showIdentityNudge.set(true);
          setTimeout(() => this.showIdentityNudge.set(false), 3000);
        }
        this.habitsCompletedTodayCount++;
        
        // Journal entry
        const habitEvent = {
          timestamp: Date.now(),
          type: habit.category === 'WORK' ? 'WORK' : 'HEALTH',
          content: `${habit.name} (Quick 5m session)`,
          payload: {
            duration_min: "5",
            linkedHabitId: habitId,
            source: "timer"
          }
        };
        this.lifeService.saveBatch([habitEvent as any]).subscribe();
      }
    });
  }

  getNudgeMessage(habit: Habit): string {
    return getNudgeMessageTemplate(habit, this.getHabitState(habit));
  }
}
