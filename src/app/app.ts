import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeService, LifeEvent } from './services/life.service';
import { SpeechService } from './services/speech.service';
import { HabitService } from './services/habit.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  public lifeService = inject(LifeService);
  public speechService = inject(SpeechService);
  public habitService = inject(HabitService);

  magicText: string = '';
  loading: boolean = false;
  editingEvent: LifeEvent | null = null;
  showDebug: boolean = false;
  
  pendingEvents: LifeEvent[] | null = null;
  pendingUpdates: any[] | null = null;
  aiAnswer: string | null = null;

  // Undo System
  recentlySavedEvents: LifeEvent[] = [];
  undoVisible = signal<boolean>(false);
  private undoTimer: any;

  // Dynamic Placeholder Logic
  placeholderSignal = signal<string>('How was your day?');
  private placeholderInterval: any;
  private placeholders = [
    { hour: [5, 11], tips: ["How did you sleep?", "Coffee 2.50€", "Morning run 5km", "Daily goals..."] },
    { hour: [11, 15], tips: ["Lunch with team 15€", "Worked 2h on project X", "Feeling productive", "Bought a book 20€"] },
    { hour: [15, 20], tips: ["Gym session 1h", "Grocery shopping 40€", "Finished report", "Call parents"] },
    { hour: [20, 5], tips: ["Dinner 25€", "Read 20 pages", "Weight: 75kg", "Evening walk 30min"] }
  ];

  readonly events = this.lifeService.events;
  readonly groupedEvents = computed(() => {
    const groups: { date: string, items: LifeEvent[] }[] = [];
    const events = this.lifeService.events();
    events.forEach(event => {
      const dateLabel = this.getRelativeDateLabel(event.timestamp);
      let group = groups.find(g => g.date === dateLabel);
      if (!group) {
        group = { date: dateLabel, items: [] };
        groups.push(group);
      }
      group.items.push(event);
    });
    return groups;
  });

  ngOnInit() {
    this.lifeService.sync();
    this.startPlaceholderRotation();
  }

  ngOnDestroy() {
    if (this.placeholderInterval) clearInterval(this.placeholderInterval);
    if (this.undoTimer) clearTimeout(this.undoTimer);
  }

  private startPlaceholderRotation() {
    this.updatePlaceholder();
    this.placeholderInterval = setInterval(() => this.updatePlaceholder(), 5000);
  }

  private updatePlaceholder() {
    const hour = new Date().getHours();
    const group = this.placeholders.find(p => {
      const [start, end] = p.hour;
      return start < end ? (hour >= start && hour < end) : (hour >= start || hour < end);
    }) || this.placeholders[0];
    const randomTip = group.tips[Math.floor(Math.random() * group.tips.length)];
    this.placeholderSignal.set(`Ex: "${randomTip}"`);
  }

  toggleListening() {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening(
        (text) => this.magicText = text,
        () => console.log('Capture ended')
      );
    }
  }

  processMagic() {
    const textInput = this.magicText.trim();
    if (!textInput || this.loading) return;

    this.loading = true;
    this.aiAnswer = null;
    this.pendingEvents = null;
    this.pendingUpdates = null;

    this.lifeService.interact(textInput)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.magicText = '';
          if (response.intent === 'ANALYSE') {
            this.aiAnswer = response.answer || 'Analyzed.';
          } else {
            this.pendingEvents = response.events || [];
            this.pendingUpdates = response.habitUpdates || [];
          }
        },
        error: (err) => {
          console.error('Magic failed', err);
          alert('AI processing failed.');
        }
      });
  }

  confirmPending() {
    if (this.pendingEvents) {
      this.loading = true;
      const eventsToSave = [...this.pendingEvents];
      this.lifeService.saveBatch({ events: eventsToSave })
        .pipe(finalize(() => {
          this.loading = false;
          this.pendingEvents = null;
          this.pendingUpdates = null;
          this.showUndo(eventsToSave);
        }))
        .subscribe();
    }
  }

  private showUndo(events: LifeEvent[]) {
    this.recentlySavedEvents = events;
    this.undoVisible.set(true);
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => this.undoVisible.set(false), 5000);
  }

  undoSave() {
    if (this.recentlySavedEvents.length > 0) {
      this.recentlySavedEvents.forEach(e => {
        this.lifeService.deleteEvent(e.timestamp).subscribe();
      });
      this.recentlySavedEvents = [];
      this.undoVisible.set(false);
    }
  }

  cancelPending() { 
    this.pendingEvents = null;
    this.pendingUpdates = null;
  }

  dismissAnswer() { this.aiAnswer = null; }
  startEdit(event: LifeEvent) { this.editingEvent = { ...event, payload: { ...event.payload } }; }
  
  saveEdit() {
    if (this.editingEvent) {
      this.lifeService.updateEvent(this.editingEvent).subscribe({
        next: () => this.editingEvent = null,
        error: (err) => console.error('Update failed', err)
      });
    }
  }

  cancelEdit() { this.editingEvent = null; }
  
  clearAll() { 
    if (confirm('Clear all data?')) {
      this.lifeService.clearAll().subscribe();
    }
  }

  private getRelativeDateLabel(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
