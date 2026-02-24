import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ExpenseSummary } from "../models/expense-summary.model";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../environments/environment.prod";

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
}
