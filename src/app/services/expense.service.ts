import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ExpenseSummary } from "../models/expense-summary.model";
import { Observable } from "rxjs";
import { environment } from "../environments/environment.prod";

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`);
  }
}