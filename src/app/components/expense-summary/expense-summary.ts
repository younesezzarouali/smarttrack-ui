import { Component, OnInit, signal } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary.html',
  standalone: true,
  imports: [CommonModule],
})
export class ExpenseSummaryComponent implements OnInit {
  summary = signal<any>(null);
  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.expenseService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: (err) => console.error('Failed to fetch summary', err)
    });
  }

  getCategories(): string[] {
    const s = this.summary();
    return s ? Object.keys(s.totalByCategory) : [];
  }
}
