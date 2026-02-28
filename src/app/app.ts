import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LifeService, LifeEvent } from './services/life.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';

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

  constructor(private lifeService: LifeService) {}

  ngOnInit() {
    this.refreshData();
  }

  processMagic() {
    if (!this.magicText.trim()) return;

    this.loading = true;
    this.lifeService.sendMagicInput(this.magicText).subscribe({
      next: (newEvents) => {
        this.magicText = '';
        this.loading = false;
        this.refreshData(); // Reload all events to see updates
      },
      error: (err) => {
        console.error('Magic failed', err);
        this.loading = false;
        alert('AI processing failed. Check your API key or connection.');
      }
    });
  }

  refreshData() {
    this.lifeService.getEvents().subscribe({
      next: (data) => {
        // Sort by timestamp descending
        this.events = data.sort((a, b) => b.timestamp - a.timestamp);
      },
      error: (err) => console.error('Failed to fetch events', err)
    });
  }
}
