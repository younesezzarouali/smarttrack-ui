import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeService, LifeEvent } from './services/life.service';
import { SpeechService } from './services/speech.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private lifeService = inject(LifeService);
  public speechService = inject(SpeechService);

  magicText: string = '';
  loading: boolean = false;
  editingEvent: LifeEvent | null = null;
  
  // State for AI validation preview
  pendingEvents: LifeEvent[] | null = null;

  // Grouped events for the timeline
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
    this.lifeService.fetchAll();
  }

  toggleListening() {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening(
        (text) => this.magicText = text,
        () => console.log('Voice capture ended')
      );
    }
  }

  processMagic() {
    const textInput = this.magicText.trim();
    if (!textInput || this.loading) return;

    this.loading = true;
    this.lifeService.parseMagicInput(textInput)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (parsed) => {
          this.magicText = '';
          this.pendingEvents = parsed; // Show preview instead of saving directly
        },
        error: (err) => {
          console.error('AI Parsing failed', err);
          alert('AI processing failed. Check your API key or connection.');
        }
      });
  }

  confirmPending() {
    if (this.pendingEvents) {
      this.loading = true;
      this.lifeService.saveEvents(this.pendingEvents)
        .pipe(finalize(() => {
          this.loading = false;
          this.pendingEvents = null;
        }))
        .subscribe();
    }
  }

  cancelPending() {
    this.pendingEvents = null;
  }

  startEdit(event: LifeEvent) {
    this.editingEvent = { ...event, payload: { ...event.payload } };
  }

  saveEdit() {
    if (this.editingEvent) {
      this.lifeService.updateEvent(this.editingEvent).subscribe({
        next: () => this.editingEvent = null,
        error: (err) => console.error('Update failed', err)
      });
    }
  }

  cancelEdit() {
    this.editingEvent = null;
  }

  clearAll() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
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
