import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeService, LifeEvent } from '../../services/life.service';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-summary.html'
})
export class ExpenseSummaryComponent implements OnInit {
  summary = signal<any>(null);

  constructor(private lifeService: LifeService) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.lifeService.getEvents().subscribe(events => {
      const financeEvents = events.filter(e => e.type === 'FINANCE');
      const total = financeEvents.sumOf(e => parseFloat(e.payload.amount || '0'));
      
      const byCat: any = {};
      financeEvents.forEach(e => {
        const cat = e.payload.category || 'OTHER';
        byCat[cat] = (byCat[cat] || 0) + parseFloat(e.payload.amount || '0');
      });

      this.summary.set({
        total: total,
        totalByCategory: byCat
      });
    });
  }

  getCategories(): string[] {
    const s = this.summary();
    return s ? Object.keys(s.totalByCategory) : [];
  }
}

// Helper extension for convenience
declare global {
  interface Array<T> {
    sumOf(selector: (item: T) => number): number;
  }
}

if (!Array.prototype.sumOf) {
  Array.prototype.sumOf = function(selector) {
    return this.reduce((acc, item) => acc + selector(item), 0);
  };
}
