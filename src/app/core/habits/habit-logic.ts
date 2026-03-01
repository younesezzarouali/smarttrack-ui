import { Habit, HabitState } from './habit-types';

export const NUDGE_TIME = 16; // 16:00
export const STREAK_RISK_TIME = 17; // 17:00

/**
 * Pure function to calculate the state of a habit based on current conditions.
 */
export function calculateHabitState(
  habit: Habit, 
  currentProgress: number, 
  currentHour: number
): HabitState {
  if (currentProgress >= habit.targetValue) return 'COMPLETED';
  if (currentProgress > 0) return 'IN_PROGRESS';

  // Not started (progress == 0)
  if (habit.currentStreak >= 1 && currentHour >= STREAK_RISK_TIME) return 'STREAK_AT_RISK';
  if (currentHour >= NUDGE_TIME) return 'NEEDS_NUDGE';
  
  return 'NOT_STARTED';
}

/**
 * Pure function to select the ONE Focus Habit of the day based on states.
 */
export function selectFocusHabitId(
  habits: Habit[], 
  states: Record<string, HabitState>
): string | null {
  if (habits.length === 0) return null;

  // 1) Streak at risk (Priority to highest streak)
  const atRisk = habits
    .filter(h => states[h.id] === 'STREAK_AT_RISK')
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
  if (atRisk.length > 0) return atRisk[0].id;

  // 2) Needs nudge
  const needsNudge = habits
    .filter(h => states[h.id] === 'NEEDS_NUDGE')
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
  if (needsNudge.length > 0) return needsNudge[0].id;

  // 3) First not started
  const notStarted = habits.find(h => states[h.id] === 'NOT_STARTED');
  if (notStarted) return notStarted.id;

  // 4) First in progress
  const inProgress = habits.find(h => states[h.id] === 'IN_PROGRESS');
  if (inProgress) return inProgress.id;

  return habits[0].id;
}

/**
 * Pure function to generate nudge messages.
 */
export function getNudgeMessageTemplate(habit: Habit, state: HabitState): string {
  if (state === 'STREAK_AT_RISK' || (habit.currentStreak >= 1)) {
    return `Keep your ${habit.currentStreak}-day streak`;
  }
  if (state === 'NEEDS_NUDGE' || state === 'NOT_STARTED') {
    return `Just 5 min to move forward`;
  }
  return `Small step. Big consistency.`;
}
