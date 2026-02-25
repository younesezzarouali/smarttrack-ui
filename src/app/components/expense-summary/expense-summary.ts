import { Component, OnInit, signal,  } from '@angular/core';
import { ExpenseSummary } from '../../models/expense-summary.model';
import { ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-summary',
  templateUrl: './expense-summary.html',
  imports: [CommonModule],
})
export class ExpenseSummaryComponent implements OnInit{
  expenseSummary = signal<ExpenseSummary | null>(null);
  constructor(private expenseService: ExpenseService){}

  ngOnInit(): void {
    console.log('Fetching expense summary...');
    this.expenseService.getSummary().subscribe({
      next: (data) => {
        console.log('Successfully fetched expense summary:', data);
        this.expenseSummary.set(new ExpenseSummary(data.totalByCategory, data.total));
      },
      error: (err) => {
        console.error('Failed to fetch expense summary:', err);
      }
    });
  }

  categories(s: ExpenseSummary): string[] {
    return Object.keys(s.totalByCategory);
  }
}
