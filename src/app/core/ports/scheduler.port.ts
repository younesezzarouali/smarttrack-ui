export interface SchedulerPort {
  start(onTick: () => void, intervalMs: number): void;
  stop(): void;
}
