# SmartTrack Core Logic (Mobile-Ready)

This directory contains the UI-agnostic core logic of the SmartTrack application. It is designed to be 100% TypeScript pure, with no dependencies on Angular, the DOM, or browser-specific APIs.

## Why this architecture?

To prepare for a high-fidelity native iPhone app (e.g., using SwiftUI), we must ensure that the "brains" of the application (Habit State Machine, Motivation Engine, Timer Controller) are not coupled to the Web UI.

## Structure

- `/habits`: Pure functions for calculating habit states, streaks, and focus selection.
- `/timer`: A Command-driven Timer Controller using the Port/Adapter pattern.
- `/ports`: Interfaces defining what the core logic needs from the platform (Clock, Scheduler, Storage).

## Portability to iOS (SwiftUI)

When building the native iOS version:
1. **Business Logic**: Re-use the same logic rules (or even the JS bundle via a bridge) to ensure consistent behavior.
2. **Ports/Adapters**: Implement the `ClockPort` and `SchedulerPort` using native iOS APIs (e.g., `Timer.publish`, `Combine`).
3. **API Consistency**: Use the same REST endpoints defined in the Quarkus backend.

## Testing

Core logic is covered by pure unit tests in `*.spec.ts` files. Run them with `npm test`.
