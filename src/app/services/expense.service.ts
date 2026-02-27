import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ExpenseSummary } from "../models/expense-summary.model";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../environments/environment.prod";

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface ExpenseAnalytics {
  total: number;
  count: number;
  average: number;
  topCategories: CategoryTotal[];
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`).pipe(
      catchError((error) => {
        console.error('Error fetching summary:', error);
        return throwError(() => new Error('Something went wrong while fetching the expense summary.'));
      })
    );
  }

  getAnalytics(): Observable<ExpenseAnalytics> {
    return this.http.get<ExpenseAnalytics>(`${this.apiUrl}/analytics`).pipe(
      catchError((error) => {
        console.error('Error fetching analytics:', error);
        return throwError(() => new Error('Something went wrong while fetching analytics.'));
      })
    );
  }
}
