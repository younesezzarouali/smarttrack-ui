import { Component, OnInit, OnDestroy, inject, computed, signal, Renderer2, NgZone } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LifeService, LifeEvent, AiError } from './services/life.service';
import { HabitService } from './services/habit.service';
import { Habit } from './core/habits/habit-types';
import { HabitsMotivationService } from './services/habits-motivation.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { CreateHabitModalComponent } from './components/create-habit-modal/create-habit-modal';
import { ToastService } from './services/toast.service';
import { finalize } from 'rxjs';

registerLocaleData(localeFr);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  public lifeService = inject(LifeService);
  public habitService = inject(HabitService);
  public motivationService = inject(HabitsMotivationService);
  public toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  readonly timerDisplay = computed(() => {
    const s = this.motivationService.timerSecondsRemaining();
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  });

  readonly currentView = signal<'home' | 'journal' | 'habits' | 'dashboard'>('home');

  readonly otherHabits = computed(() => {
    const habits = this.habitService.habits();
    const focusId = this.motivationService.focusHabitId();
    return habits.filter(h => h.id !== focusId);
  });

  magicText = signal<string>('');
  loading: boolean = false;
  loadingStatus = signal<string>('');
  private loadingTimer: any;
  aiError = signal<AiError | null>(null);
  
  editingEvent: LifeEvent | null = null;
  showResetConfirm = signal<boolean>(false);
  
  pendingEvents = signal<LifeEvent[]>([]);
  pendingUpdates = signal<any[]>([]);
  aiAnswer = signal<string | null>(null);
  aiAdvice = signal<any | null>(null);

  recentlySavedEvents: LifeEvent[] = [];
  undoVisible = signal<boolean>(false);
  private undoTimer: any;

  readonly events = this.lifeService.events;
  
  isListening = signal<boolean>(false);
  private recognition: any;
  private voiceTimeout: any;
  private fullTranscript: string = '';

  private setupVoice() {
    const WindowSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (WindowSpeech) {
      this.recognition = new WindowSpeech();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = true; // On garde la connexion ouverte
      this.recognition.interimResults = true; // On veut les résultats PARTIELS (instantanés)

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Mise à jour instantanée du signal pour affichage en direct
        this.magicText.set(transcript);
        this.resetVoiceTimer();
      };

      this.recognition.onerror = () => this.stopListening();
      this.recognition.onend = () => {
        if (this.isListening()) {
           try { this.recognition.start(); } catch(e) {}
        }
      };
    }
  }

  private resetVoiceTimer() {
    if (this.voiceTimeout) clearTimeout(this.voiceTimeout);
    this.voiceTimeout = setTimeout(() => this.stopListening(), 10000);
  }

  private stopListening() {
    this.recognition?.stop();
    this.isListening.set(false);
    if (this.voiceTimeout) clearTimeout(this.voiceTimeout);
  }

  toggleSpeech() {
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.magicText.set('');
      this.isListening.set(true);
      this.recognition?.start();
      this.resetVoiceTimer();
    }
  }

  getHabitStatus(habit: Habit): 'AT_RISK' | 'IN_PROGRESS' | 'COMPLETED' {
    const progress = this.habitService.getHabitProgress(habit.id);
    if (progress >= habit.targetValue) return 'COMPLETED';
    
    const now = new Date();
    const hour = now.getHours();
    if (progress === 0 && hour >= 14) return 'AT_RISK';
    
    return progress > 0 ? 'IN_PROGRESS' : 'IN_PROGRESS';
  }

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
      const dateLabel = new Date(event.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      let group = groups.find(g => g.date === dateLabel);
      if (!group) { group = { date: dateLabel, items: [] }; groups.push(group); }
      group.items.push(event);
    });
    return groups;
  });

  ngOnInit() {
    this.lifeService.sync();
    this.habitService.fetchHabits();
    this.setupVisualViewport();
    this.setupVoice();
  }

  ngOnDestroy() {
    if (this.undoTimer) clearTimeout(this.undoTimer);
    if (this.loadingTimer) clearInterval(this.loadingTimer);
  }

  private setupVisualViewport() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const keyboardHeight = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
        document.documentElement.style.setProperty('--kb-height', `${keyboardHeight}px`);
      });
    }
  }

  setView(view: 'home' | 'journal' | 'habits' | 'dashboard') {
    this.currentView.set(view);
  }

  processMagic() {
    if (this.isListening()) {
      this.stopListening();
    }

    const textInput = this.magicText().trim();
    if (!textInput || this.loading) return;
    
    this.loading = true;
    this.aiError.set(null);
    this.loadingStatus.set('Analyse…');
    this.aiAnswer.set(null);
    this.aiAdvice.set(null);
    this.pendingEvents.set([]);
    this.pendingUpdates.set([]);

    this.lifeService.interact(textInput)
      .pipe(finalize(() => {
        this.loading = false;
        clearInterval(this.loadingTimer);
      }))
      .subscribe({
        next: (response) => {
          this.magicText.set('');
          this.loadingStatus.set('');
          
          if (response.advice) {
            this.aiAdvice.set(response.advice);
            return;
          }

          if (response.answer || response.dailyInsight) {
            this.aiAnswer.set(response.answer || response.dailyInsight || null);
            this.pendingEvents.set([]);
            this.pendingUpdates.set([]);
          } else {
            this.pendingEvents.set(response.events || []);
            this.pendingUpdates.set(response.habitUpdates || []);
          }
        },
        error: (err: AiError) => {
          this.loadingStatus.set('');
          this.aiError.set(err);
        }
      });
  }

  executeAdvice() {
    const advice = this.aiAdvice();
    if (advice && advice.cta_habit_id) {
      this.motivationService.startTimer(advice.cta_habit_id);
      this.aiAdvice.set(null);
    }
  }

  retryMagic() {
    this.aiError.set(null);
    this.processMagic();
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
    this.recentlySavedEvents.forEach(e => this.deleteEvent(e.timestamp, true));
    this.undoVisible.set(false);
  }

  cancelPending() { 
    this.pendingEvents.set([]);
    this.pendingUpdates.set([]);
  }

  startEdit(event: LifeEvent) {
    // Deep clone to avoid immediate binding
    this.editingEvent = JSON.parse(JSON.stringify(event));
  }

  saveEdit() {
    if (this.editingEvent) {
      this.loading = true;
      this.lifeService.updateEvent(this.editingEvent)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.editingEvent = null;
            this.toastService.show('Entrée mise à jour');
          },
          error: (err: any) => console.error('Update failed', err)
        });
    }
  }

  cancelEdit() {
    this.editingEvent = null;
  }

  deleteEvent(timestamp: number, skipConfirm = false) {
    if (skipConfirm || confirm('Supprimer cet événement ?')) {
      this.lifeService.deleteEvent(timestamp).subscribe();
    }
  }

  openCreateHabit() {
    this.modalService.open(CreateHabitModalComponent, { centered: true, size: 'sm', windowClass: 'mini-modal' });
  }

  deleteHabit(id: string) {
    if (confirm('Archiver cette habitude ?')) {
      this.habitService.deleteHabit(id).subscribe();
    }
  }

  clearAll() { 
    this.lifeService.clearAll().subscribe(() => {
      this.showResetConfirm.set(false);
      this.toastService.show('Données réinitialisées');
    });
  }
}
