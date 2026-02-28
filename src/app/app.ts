import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LifeService, LifeEvent } from './services/life.service';
import { SpeechService } from './services/speech.service';
import { HabitService } from './services/habit.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { CreateHabitModalComponent } from './components/create-habit-modal/create-habit-modal';
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
  private modalService = inject(NgbModal);

  magicText: string = '';
  loading: boolean = false;
  editingEvent: LifeEvent | null = null;
  showDebug: boolean = false;
  
  pendingEvents: LifeEvent[] = [];
  pendingUpdates: any[] = [];
  aiAnswer: string | null = null;

  recentlySavedEvents: LifeEvent[] = [];
  undoVisible = signal<boolean>(false);
  private undoTimer: any;

  placeholderSignal = signal<string>('How was your day?');

  readonly events = this.lifeService.events;
  readonly groupedEvents = computed(() => {
    const groups: { date: string, items: LifeEvent[] }[] = [];
    this.lifeService.events().forEach(event => {
      const dateLabel = new Date(event.timestamp).toLocaleDateString();
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
    this.habitService.fetchHabits();
  }

  ngOnDestroy() {
    if (this.undoTimer) clearTimeout(this.undoTimer);
  }

  toggleListening() {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening((text) => this.magicText = text, () => {});
    }
  }

  processMagic() {
    const textInput = this.magicText.trim();
    if (!textInput || this.loading) return;

    this.loading = true;
    this.aiAnswer = null;
    this.pendingEvents = [];
    this.pendingUpdates = [];

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
        error: (err: any) => console.error('Magic failed', err)
      });
  }

  confirmPending() {
    if (this.pendingEvents.length > 0 || this.pendingUpdates.length > 0) {
      this.loading = true;
      const eventsToSave = [...this.pendingEvents];
      this.lifeService.saveBatch(eventsToSave)
        .pipe(finalize(() => {
          this.loading = false;
          this.pendingEvents = [];
          this.pendingUpdates = [];
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
    this.recentlySavedEvents.forEach(e => this.lifeService.deleteEvent(e.timestamp).subscribe());
    this.undoVisible.set(false);
  }

  cancelPending() { 
    this.pendingEvents = [];
    this.pendingUpdates = [];
  }

  openCreateHabit() {
    this.modalService.open(CreateHabitModalComponent, { centered: true });
  }

  deleteHabit(id: string) {
    if (confirm('Delete this habit?')) {
      this.habitService.deleteHabit(id).subscribe();
    }
  }

  clearAll() { 
    if (confirm('Clear all data?')) {
      this.lifeService.clearAll().subscribe();
    }
  }

  placeholderSignalValue = computed(() => this.placeholderSignal());
}
