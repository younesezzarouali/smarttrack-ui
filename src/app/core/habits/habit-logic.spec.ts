import { calculateHabitState, selectFocusHabitId, NUDGE_TIME, STREAK_RISK_TIME } from './habit-logic';
import { Habit, HabitState } from './habit-types';

describe('HabitCoreLogic', () => {
  const mockHabit: Habit = {
    id: '1',
    name: 'Sport',
    type: 'TIME',
    targetValue: 15,
    unit: 'min',
    category: 'HEALTH',
    currentStreak: 5,
    longestStreak: 10,
    priority: 1,
    lastCompletedDate: '',
    active: true
  };

  describe('calculateHabitState', () => {
    it('should return COMPLETED when progress >= target', () => {
      expect(calculateHabitState(mockHabit, 15, 10)).toBe('COMPLETED');
      expect(calculateHabitState(mockHabit, 20, 10)).toBe('COMPLETED');
    });

    it('should return IN_PROGRESS when 0 < progress < target', () => {
      expect(calculateHabitState(mockHabit, 5, 10)).toBe('IN_PROGRESS');
    });

    it('should return STREAK_AT_RISK when progress is 0, streak >= 1 and time >= 17:00', () => {
      expect(calculateHabitState(mockHabit, 0, STREAK_RISK_TIME)).toBe('STREAK_AT_RISK');
      expect(calculateHabitState(mockHabit, 0, 20)).toBe('STREAK_AT_RISK');
    });

    it('should return NEEDS_NUDGE when progress is 0 and time >= 16:00', () => {
      expect(calculateHabitState(mockHabit, 0, NUDGE_TIME)).toBe('NEEDS_NUDGE');
    });

    it('should return NOT_STARTED in early morning', () => {
      expect(calculateHabitState(mockHabit, 0, 8)).toBe('NOT_STARTED');
    });
  });

  describe('selectFocusHabitId', () => {
    it('should prioritize STREAK_AT_RISK', () => {
      const habits: Habit[] = [
        { ...mockHabit, id: '1', currentStreak: 1 },
        { ...mockHabit, id: '2', currentStreak: 10 }
      ];
      const states: Record<string, HabitState> = {
        '1': 'NOT_STARTED',
        '2': 'STREAK_AT_RISK'
      };
      expect(selectFocusHabitId(habits, states)).toBe('2');
    });

    it('should prioritize NEEDS_NUDGE over NOT_STARTED', () => {
      const habits: Habit[] = [
        { ...mockHabit, id: '1' },
        { ...mockHabit, id: '2' }
      ];
      const states: Record<string, HabitState> = {
        '1': 'NOT_STARTED',
        '2': 'NEEDS_NUDGE'
      };
      expect(selectFocusHabitId(habits, states)).toBe('2');
    });
  });
});
