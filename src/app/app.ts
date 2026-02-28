import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeService } from './services/life.service';
import { SpeechService } from './services/speech.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  magicText: string = '';
  loading: boolean = false;

  // Delegate event list to the service signals
  readonly events = this.lifeService.events;

  constructor(
    private lifeService: LifeService,
    public speechService: SpeechService
  ) {}

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

  clearAll() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      this.lifeService.clearAll().subscribe({
        error: (err) => console.error('Clear failed', err)
      });
    }
  }
}
