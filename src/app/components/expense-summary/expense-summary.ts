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
  
  // Calcul automatique du total
  readonly totalSpent = computed(() => {
    return this.lifeService.financeEvents().reduce((acc, e) => {
      const amt = parseFloat(e.payload.amount);
      return acc + (isNaN(amt) ? 0 : amt);
    }, 0);
  });

  // Calcul automatique de la répartition par catégorie
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

  // Signal pour la liste des noms de catégories
  readonly categoryNames = computed(() => Object.keys(this.categoriesBreakdown()));

  // Calcul du pourcentage pour les barres de progression
  getPercentage(amount: number): number {
    const total = this.totalSpent();
    return total > 0 ? (amount / total) * 100 : 0;
  }
}
