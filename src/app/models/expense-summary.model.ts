export class ExpenseSummary {
    totalByCategory: { [key: string]: number }; // équivalent du Map<ExpenseCategory, Double>
    total: number

    constructor(totalByCategory: { [key: string]: number } = {}, total: number = 0) {
        this.totalByCategory = totalByCategory;
        this.total = total;
      }

    getPercentage(category: string): number {
        if (this.total === 0) return 0; // éviter division par 0
        return ((this.totalByCategory[category] || 0) / this.total) * 100;
      }
}