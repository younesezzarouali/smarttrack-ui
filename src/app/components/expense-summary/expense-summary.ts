import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeService } from '../../services/life.service';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-summary.html'
})
export class ExpenseSummaryComponent {
  private lifeService = inject(LifeService);
  
  // FINANCE Metrics
  readonly totalSpent = computed(() => {
    return this.lifeService.financeEvents().reduce((acc, e) => {
      const amt = parseFloat(e.payload.amount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  });

  readonly categoriesBreakdown = computed(() => {
    const breakdown: Record<string, number> = {};
    this.lifeService.financeEvents().forEach(e => {
      const cat = e.payload.category || 'OTHER';
      const amt = parseFloat(e.payload.amount);
      if (!isNaN(amt)) {
        breakdown[cat] = (breakdown[cat] || 0) + amt;
      }
    });
    return breakdown;
  });

  // WORK Metrics (Total Duration in hours)
  readonly workHours = computed(() => {
    const totalMinutes = this.lifeService.events()
      .filter(e => e.type === 'WORK')
      .reduce((acc, e) => acc + (parseInt(e.payload.duration_min) || 0), 0);
    return (totalMinutes / 60).toFixed(1);
  });

  // HEALTH Metrics & Vitality Score
  readonly healthActivities = computed(() => {
    return this.lifeService.events().filter(e => e.type === 'HEALTH').length;
  });

  /**
   * VITALITY SCORE LOGIC:
   * Base: 50%
   * +15% per health activity (max 30%)
   * +10% for POSITIVE sentiments
   * -10% for NEGATIVE sentiments
   */
  readonly vitalityScore = computed(() => {
    let score = 50;
    const events = this.lifeService.events();
    
    // Add health bonus
    const healthCount = events.filter(e => e.type === 'HEALTH').length;
    score += Math.min(healthCount * 15, 30);

    // Sentiment impact
    events.forEach(e => {
      if (e.payload.sentiment === 'POSITIVE') score += 5;
      if (e.payload.sentiment === 'NEGATIVE') score -= 10;
    });

    return Math.min(Math.max(score, 0), 100);
  });

  readonly categoryNames = computed(() => Object.keys(this.categoriesBreakdown()));

  getPercentage(amount: number): number {
    const total = this.totalSpent();
    return total > 0 ? (amount / total) * 100 : 0;
  }
}
