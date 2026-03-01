export type HabitState = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'NEEDS_NUDGE' | 'STREAK_AT_RISK';

export interface Habit {
  id: string;
  name: string;
  type: 'TIME' | 'COUNT' | 'BOOLEAN';
  targetValue: number;
  unit: string;
  category: string;
  currentStreak: number;
  longestStreak: number;
  priority: number; // 1 (High), 2 (Medium), 3 (Low)
  lastCompletedDate: string;
  active: boolean;
}

export interface HabitProgress {
  userId: string;
  date: string;
  progressMap: Record<string, number>;
  completedIds: string[];
}

export interface DaySummary {
  date: string;
  label: string;
  ratio: number;
}

export interface WeeklySummary {
  days: DaySummary[];
  totalScore: string;
}
