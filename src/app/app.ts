import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpenseService } from './services/expense.service';
import { ExpenseSummaryComponent } from './components/expense-summary/expense-summary';
import { ExpenseModalComponent } from './components/expense-modal/expense-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ExpenseSummaryComponent, ExpenseModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'smarttrack-ui';
  summary: any = null;
  expenses: any[] = [];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.expenseService.getSummary().subscribe({
      next: (data) => this.summary = data,
      error: (err) => console.error('Failed to fetch summary', err)
    });

    this.expenseService.getExpenses().subscribe({
      next: (data) => this.expenses = data,
      error: (err) => console.error('Failed to fetch expenses', err)
    });
  }
}
