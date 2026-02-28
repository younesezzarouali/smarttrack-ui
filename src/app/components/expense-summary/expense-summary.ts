import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeService } from '../../services/life.service';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-summary.html'
})
export class ExpenseSummaryComponent {
  
  // Reactive summary based on the global lifeService state
  readonly summary = computed(() => {
    const events = this.lifeService.financeEvents();
    const total = events.reduce((acc, e) => acc + parseFloat(e.payload.amount || '0'), 0);
    
    const byCat: Record<string, number> = {};
    events.forEach(e => {
      const cat = e.payload.category || 'OTHER';
      byCat[cat] = (byCat[cat] || 0) + parseFloat(e.payload.amount || '0');
    });

    return { total, totalByCategory: byCat };
  });

  constructor(private lifeService: LifeService) {}

  getCategories(): string[] {
    return Object.keys(this.summary().totalByCategory);
  }
}
