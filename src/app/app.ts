import { Component, OnInit, signal } from '@angular/core';
import { ExpenseModalComponent } from './components/expense-modal/expense-modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseSummaryComponent } from "./components/expense-summary/expense-summary";
import { ExpenseAnalytics, ExpenseService } from './services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(
    private modalService: NgbModal,
    private expenseService: ExpenseService
  ) {}

  year = new Date().getFullYear();
  greeting = this.getGreeting();

  analytics = signal<ExpenseAnalytics | null>(null);
  animatedTotal = signal(0);
  animatedAverage = signal(0);

  ngOnInit(): void {
    this.expenseService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.animateCounter('total', data.total);
        this.animateCounter('average', data.average);
      },
      error: (err) => console.error('Failed to fetch analytics', err)
    });
  }

  private animateCounter(type: 'total' | 'average', target: number) {
    const steps = 24;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      if (type === 'total') this.animatedTotal.set(Math.round(current));
      else this.animatedAverage.set(Math.round(current));
    }, 30);
  }

  private getGreeting(): string {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bonjour';
    if (hours < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  openExpenseModal() {
    this.modalService.open(ExpenseModalComponent)
  }
}
