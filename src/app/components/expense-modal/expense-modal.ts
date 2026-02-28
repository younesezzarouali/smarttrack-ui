import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  templateUrl: './expense-modal.html'
})
export class ExpenseModalComponent {
  // ⚡ Signals pour les champs
  label = signal<string>('');
  amount = signal<number>(0);
  category = signal<string>('OTHER');
  apiUrl = environment.apiUrl

  constructor(private http: HttpClient, private modalService: NgbModal) {}

  addExpense() {
    this.http.post(`${this.apiUrl}/expenses`, {
      label: this.label(),
      amount: this.amount(),
      category: this.category()
    }).subscribe({
      next: res =>  {
        console.log('Expense added', res);
        this.modalService.dismissAll();
      },
      error: err => console.error('Error', err)
    });
  }
}