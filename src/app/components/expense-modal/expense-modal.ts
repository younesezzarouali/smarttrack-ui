import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  templateUrl: './expense-modal.html'
})
export class ExpenseModalComponent {
  // ⚡ Signals pour les champs
  description = signal<string>('');
  amount = signal<number>(0);
  category = signal<string>('OTHER');
  apiUrl = environment.apiUrl

  constructor(private http: HttpClient) {}

  addExpense() {
    this.http.post(`${this.apiUrl}/expenses`, {
      description: this.description(),
      amount: this.amount(),
      category: this.category()
    }).subscribe({
      next: res => console.log('Expense added', res),
      error: err => console.error('Error', err)
    });
  }
}