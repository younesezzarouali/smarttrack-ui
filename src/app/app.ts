import { Component, OnInit, inject } from '@angular/core';
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

  readonly events = this.lifeService.events;

  ngOnInit() {
    this.lifeService.fetchAll();
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
    this.lifeService.sendMagicInput(textInput)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => this.magicText = '',
        error: (err) => {
          console.error('Magic failed', err);
          alert('AI processing failed. Check your API key or connection.');
        }
      });
  }

  startEdit(event: LifeEvent) {
    // Create a deep copy to avoid direct binding while editing
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
      this.lifeService.clearAll().subscribe({
        error: (err) => console.error('Clear failed', err)
      });
    }
  }
}
