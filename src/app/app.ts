import { Component, OnInit, OnDestroy, inject, computed, signal, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LifeService, LifeEvent } from './services/life.service';
import { VoiceService } from './core/voice/voice.service';
import { HabitService } from './services/habit.service';
import { HabitsMotivationService } from './services/habits-motivation.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { CreateHabitModalComponent } from './components/create-habit-modal/create-habit-modal';
import { ToastService } from './services/toast.service';
import { finalize, Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  public lifeService = inject(LifeService);
  public voiceService = inject(VoiceService);
  public habitService = inject(HabitService);
  public motivationService = inject(HabitsMotivationService);
  public toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  private renderer = inject(Renderer2);

  private voiceSubs: Subscription[] = [];
  private keyboardSubs: any[] = [];

  readonly timerDisplay = computed(() => {
    const s = this.motivationService.timerSecondsRemaining();
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  });

  // Navigation state
  readonly currentView = signal<'home' | 'journal' | 'habits' | 'dashboard'>('home');

  readonly otherHabits = computed(() => {
    const habits = this.habitService.habits();
    const focusId = this.motivationService.focusHabitId();
    return habits.filter(h => h.id !== focusId);
  });

  magicText: string = '';
  loading: boolean = false;
  editingEvent: LifeEvent | null = null;
  showDebug: boolean = false;
  
  pendingEvents = signal<LifeEvent[]>([]);
  pendingUpdates = signal<any[]>([]);
  aiAnswer = signal<string | null>(null);

  recentlySavedEvents: LifeEvent[] = [];
  undoVisible = signal<boolean>(false);
  private undoTimer: any;

  readonly events = this.lifeService.events;
  
  getVitality(): number {
    let score = 50;
    const events = this.lifeService.events();
    const healthCount = events.filter(e => e.type === 'HEALTH').length;
    score += Math.min(healthCount * 15, 30);
    
    const completedHabits = this.habitService.progress()?.completedIds?.length || 0;
    score += (completedHabits * 10);

    events.forEach(e => {
      if (e.payload.sentiment === 'POSITIVE') score += 5;
      if (e.payload.sentiment === 'NEGATIVE') score -= 10;
    });
    return Math.min(Math.max(score, 0), 100);
  }

  readonly groupedEvents = computed(() => {
    const groups: { date: string, items: LifeEvent[] }[] = [];
    this.lifeService.events().forEach(event => {
      const dateLabel = new Date(event.timestamp).toLocaleDateString();
      let group = groups.find(g => g.date === dateLabel);
      if (!group) { group = { date: dateLabel, items: [] }; groups.push(group); }
      group.items.push(event);
    });
    return groups;
  });

  ngOnInit() {
    this.lifeService.sync();
    this.habitService.fetchHabits();
    this.setupVoiceListeners();
    this.setupKeyboardListeners();
  }

  ngOnDestroy() {
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.voiceSubs.forEach(s => s.unsubscribe());
    this.keyboardSubs.forEach(s => s.remove());
  }

  private setupKeyboardListeners() {
    if (Capacitor.getPlatform() === 'ios') {
      this.renderer.addClass(document.body, 'platform-ios');

      Keyboard.addListener('keyboardWillShow', () => {
        this.renderer.addClass(document.body, 'keyboard-open');
      }).then(s => this.keyboardSubs.push(s));

      Keyboard.addListener('keyboardWillHide', () => {
        this.renderer.removeClass(document.body, 'keyboard-open');
      }).then(s => this.keyboardSubs.push(s));
    }
  }

  private setupVoiceListeners() {
    this.voiceSubs.push(
      this.voiceService.onPartialResult$.subscribe(text => {
        this.magicText = text;
      }),
      this.voiceService.onFinalResult$.subscribe(text => {
        this.magicText = text;
      }),
      this.voiceService.onError$.subscribe(err => {
        let msg = "Erreur micro";
        if (err === 'NOT_AVAILABLE') msg = "Vocal non disponible.";
        if (err === 'PERMISSION_DENIED') msg = "Activez le micro dans les réglages.";
        if (err === 'not-allowed') msg = "Microphone non autorisé.";
        this.toastService.show(msg);
      })
    );
  }

  setView(view: 'home' | 'journal' | 'habits' | 'dashboard') {
    this.currentView.set(view);
  }

  toggleListening() {
    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
    }
  }

  processMagic() {
    const textInput = this.magicText.trim();
    if (!textInput || this.loading) return;
    this.loading = true;
    this.aiAnswer.set(null);
    this.pendingEvents.set([]);
    this.pendingUpdates.set([]);

    this.lifeService.interact(textInput)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.magicText = '';
          if (response.intent === 'ANALYSE') {
            this.aiAnswer.set(response.answer || 'Analyzed.');
          } else {
            this.pendingEvents.set(response.events || []);
            this.pendingUpdates.set(response.habitUpdates || []);
          }
        },
        error: (err: any) => console.error('Magic failed', err)
      });
  }

  confirmPending() {
    const eventsToSave = [...this.pendingEvents()];
    if (eventsToSave.length > 0 || this.pendingUpdates().length > 0) {
      this.loading = true;
      this.lifeService.saveBatch(eventsToSave)
        .pipe(finalize(() => {
          this.loading = false;
          this.pendingEvents.set([]);
          this.pendingUpdates.set([]);
          this.showUndo(eventsToSave);
        }))
        .subscribe();
    }
  }

  private showUndo(events: LifeEvent[]) {
    if (events.length === 0) return;
    this.recentlySavedEvents = events;
    this.undoVisible.set(true);
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => this.undoVisible.set(false), 5000);
  }

  undoSave() {
    this.recentlySavedEvents.forEach(e => this.deleteEvent(e.timestamp));
    this.undoVisible.set(false);
  }

  cancelPending() { 
    this.pendingEvents.set([]);
    this.pendingUpdates.set([]);
  }

  startEdit(event: LifeEvent) {
    this.editingEvent = { ...event, payload: { ...event.payload } };
  }

  saveEdit() {
    if (this.editingEvent) {
      this.lifeService.updateEvent(this.editingEvent).subscribe({
        next: () => this.editingEvent = null,
        error: (err: any) => console.error('Update failed', err)
      });
    }
  }

  cancelEdit() {
    this.editingEvent = null;
  }

  deleteEvent(timestamp: number) {
    if (confirm('Delete this event?')) {
      this.lifeService.deleteEvent(timestamp).subscribe();
    }
  }

  openCreateHabit() {
    this.modalService.open(CreateHabitModalComponent, { centered: true, size: 'sm', windowClass: 'mini-modal' });
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
}
