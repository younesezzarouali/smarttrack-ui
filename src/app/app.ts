import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExpenseModalComponent } from './components/expense-modal/expense-modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseSummaryComponent } from "./components/expense-summary/expense-summary";

@Component({
  selector: 'app-root',
  imports: [ExpenseSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private modalService: NgbModal) {
  }

  year = new Date().getFullYear();

  openExpenseModal() {
    this.modalService.open(ExpenseModalComponent)
  }
}
