import { Component, OnInit, signal } from '@angular/core';
import { ExpenseModalComponent } from './components/expense-modal/expense-modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseSummaryComponent } from "./components/expense-summary/expense-summary";
import { ExpenseAnalytics, ExpenseService, ExpenseTrends } from './services/expense.service';
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
  trends = signal<ExpenseTrends | null>(null);
  isLoadingTrends = signal(true);
  selectedDays = signal(7);

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

    this.loadTrends(7);
  }

  loadTrends(days: number) {
    this.selectedDays.set(days);
    this.isLoadingTrends.set(true);
    this.expenseService.getTrends(days).subscribe({
      next: (data) => {
        this.trends.set(data);
        this.isLoadingTrends.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch trends', err);
        this.isLoadingTrends.set(false);
      }
    });
  }

  trendPath(): string {
    const trend = this.trends();
    if (!trend || trend.points.length === 0) return '';

    const w = 320;
    const h = 80;
    const max = Math.max(...trend.points.map(p => p.total), 1);

    return trend.points.map((p, i) => {
      const x = (i / Math.max(trend.points.length - 1, 1)) * w;
      const y = h - ((p.total / max) * h);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
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
