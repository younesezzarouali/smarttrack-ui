import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeService, LifeEvent } from './services/life.service';
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
  events: LifeEvent[] = [];

  constructor(
    private lifeService: LifeService,
    public speechService: SpeechService
  ) {}

  ngOnInit() {
    this.refreshData();
  }

  toggleListening() {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening(
        (text) => {
          this.magicText = text;
        },
        () => {
          // On end, we DO NOT auto-process. 
          // We let the user review and click send manually.
          console.log('Voice capture ended. Waiting for user to send manually.');
        }
      );
    }
  }

  processMagic() {
    if (!this.magicText.trim() || this.loading) return;

    this.loading = true;
    this.lifeService.sendMagicInput(this.magicText)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (newEvents) => {
          this.magicText = '';
          this.refreshData();
        },
        error: (err) => {
          console.error('Magic failed', err);
          alert('AI processing failed. Check your API key or connection.');
        }
      });
  }

  refreshData() {
    this.lifeService.getEvents().subscribe({
      next: (data) => {
        this.events = data.sort((a, b) => b.timestamp - a.timestamp);
      },
      error: (err) => console.error('Failed to fetch events', err)
    });
  }
}
