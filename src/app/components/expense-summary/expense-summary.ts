import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeService } from '../../services/life.service';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-expense-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-summary.html'
})
export class ExpenseSummaryComponent {
  private lifeService = inject(LifeService);
  public habitService = inject(HabitService);
  
  // Weekly Goals (Static for now)
  readonly GOALS = {
    budget: 400,
    sport: 3,
    work: 10
  };

  // FINANCE Metrics
  readonly totalSpent = computed(() => {
    return this.lifeService.financeEvents().reduce((acc, e) => {
      const amt = parseFloat(e.payload.amount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  });

  // WORK Metrics
  readonly workHoursNum = computed(() => {
    const totalMinutes = this.lifeService.events()
      .filter(e => e.type === 'WORK')
      .reduce((acc, e) => acc + (parseInt(e.payload.duration_min) || 0), 0);
    return totalMinutes / 60;
  });

  readonly workHoursStr = computed(() => this.workHoursNum().toFixed(1));

  // HEALTH Metrics
  readonly healthActivities = computed(() => {
    return this.lifeService.events().filter(e => e.type === 'HEALTH').length;
  });

  readonly vitalityScore = computed(() => {
    let score = 50;
    const events = this.lifeService.events();
    const healthCount = events.filter(e => e.type === 'HEALTH').length;
    score += Math.min(healthCount * 15, 30);
    
    // Add habits bonus
    const completedHabits = this.habitService.progress()?.completedIds?.length || 0;
    score += (completedHabits * 10);

    events.forEach(e => {
      if (e.payload.sentiment === 'POSITIVE') score += 5;
      if (e.payload.sentiment === 'NEGATIVE') score -= 10;
    });
    return Math.min(Math.max(score, 0), 100);
  });

  // Goal Progress Calculations
  readonly budgetProgress = computed(() => Math.min((this.totalSpent() / this.GOALS.budget) * 100, 100));
  readonly sportProgress = computed(() => Math.min((this.healthActivities() / this.GOALS.sport) * 100, 100));
  readonly workProgress = computed(() => Math.min((this.workHoursNum() / this.GOALS.work) * 100, 100));
}
