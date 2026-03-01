import { ClockPort } from '../ports/clock.port';
import { SchedulerPort } from '../ports/scheduler.port';

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface TimerState {
  status: TimerStatus;
  remainingSeconds: number;
  habitId: string | null;
  startedAt: Date | null;
}

export class TimerController {
  private state: TimerState = {
    status: 'IDLE',
    remainingSeconds: 0,
    habitId: null,
    startedAt: null
  };

  private onCompleteCallback?: (habitId: string) => void;
  private onTickCallback?: (state: TimerState) => void;

  constructor(
    private clock: ClockPort,
    private scheduler: SchedulerPort
  ) {}

  start(durationMin: number, habitId: string) {
    this.state = {
      status: 'RUNNING',
      remainingSeconds: durationMin * 60,
      habitId: habitId,
      startedAt: this.clock.now()
    };

    this.scheduler.stop();
    this.scheduler.start(() => this.tick(), 1000);
    this.notify();
  }

  cancel() {
    this.scheduler.stop();
    this.state = {
      status: 'IDLE',
      remainingSeconds: 0,
      habitId: null,
      startedAt: null
    };
    this.notify();
  }

  pause() {
    if (this.state.status === 'RUNNING') {
      this.scheduler.stop();
      this.state.status = 'PAUSED';
      this.notify();
    }
  }

  resume() {
    if (this.state.status === 'PAUSED') {
      this.state.status = 'RUNNING';
      this.scheduler.start(() => this.tick(), 1000);
      this.notify();
    }
  }

  getState(): TimerState {
    return { ...this.state };
  }

  onTick(callback: (state: TimerState) => void) {
    this.onTickCallback = callback;
  }

  onComplete(callback: (habitId: string) => void) {
    this.onCompleteCallback = callback;
  }

  private tick() {
    if (this.state.status !== 'RUNNING') return;

    if (this.state.remainingSeconds <= 0) {
      this.complete();
    } else {
      this.state.remainingSeconds--;
      this.notify();
    }
  }

  private complete() {
    this.scheduler.stop();
    const habitId = this.state.habitId;
    this.state.status = 'COMPLETED';
    this.notify();
    if (habitId && this.onCompleteCallback) {
      this.onCompleteCallback(habitId);
    }
  }

  private notify() {
    if (this.onTickCallback) {
      this.onTickCallback({ ...this.state });
    }
  }
}
