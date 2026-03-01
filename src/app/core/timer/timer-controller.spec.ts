import { TimerController } from './timer-controller';
import { ClockPort } from '../ports/clock.port';
import { SchedulerPort } from '../ports/scheduler.port';

class MockClock implements ClockPort {
  now() { return new Date(2026, 2, 1, 10, 0, 0); }
}

class MockScheduler implements SchedulerPort {
  private tickCallback?: () => void;
  start(onTick: () => void) { this.tickCallback = onTick; }
  stop() { this.tickCallback = undefined; }
  triggerTick() { if (this.tickCallback) this.tickCallback(); }
}

describe('TimerController', () => {
  let controller: TimerController;
  let scheduler: MockScheduler;

  beforeEach(() => {
    scheduler = new MockScheduler();
    controller = new TimerController(new MockClock(), scheduler);
  });

  it('should start with correct duration and notify', () => {
    let lastState: any;
    controller.onTick(state => lastState = state);
    
    controller.start(5, 'habit-1');
    
    expect(lastState.status).toBe('RUNNING');
    expect(lastState.remainingSeconds).toBe(300);
    expect(lastState.habitId).toBe('habit-1');
  });

  it('should decrement seconds on tick', () => {
    let lastState: any;
    controller.start(5, 'habit-1');
    controller.onTick(state => lastState = state);
    
    scheduler.triggerTick();
    
    expect(lastState.remainingSeconds).toBe(299);
  });

  it('should call onComplete when time reaches zero', () => {
    let completedHabitId = '';
    controller.onComplete(id => completedHabitId = id);
    
    // Start with 1 second for fast test
    controller.start(1/60, 'habit-1'); 
    scheduler.triggerTick(); // to 0
    scheduler.triggerTick(); // triggers completion
    
    expect(completedHabitId).toBe('habit-1');
    expect(controller.getState().status).toBe('COMPLETED');
  });

  it('should handle cancelation', () => {
    controller.start(5, 'habit-1');
    controller.cancel();
    
    expect(controller.getState().status).toBe('IDLE');
    expect(controller.getState().habitId).toBeNull();
  });
});
