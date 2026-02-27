import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ExpenseSummary } from "../models/expense-summary.model";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../environments/environment.prod";

export interface CategoryTotal {
  category: string;
  total: number;

  getTrends(days: number = 7): Observable<ExpenseTrends> {
    return this.http.get<ExpenseTrends>(`${this.apiUrl}/trends?days=${days}`).pipe(
      catchError((error) => {
        console.error('Error fetching trends:', error);
        return throwError(() => new Error('Something went wrong while fetching trends.'));
      })
    );
  }
}

export interface ExpenseTrendPoint {
  date: string;
  total: number;

  getTrends(days: number = 7): Observable<ExpenseTrends> {
    return this.http.get<ExpenseTrends>(`${this.apiUrl}/trends?days=${days}`).pipe(
      catchError((error) => {
        console.error('Error fetching trends:', error);
        return throwError(() => new Error('Something went wrong while fetching trends.'));
      })
    );
  }
}

export interface ExpenseTrends {
  days: number;
  points: ExpenseTrendPoint[];
  averagePerDay: number;
  trendDelta: number;

  getTrends(days: number = 7): Observable<ExpenseTrends> {
    return this.http.get<ExpenseTrends>(`${this.apiUrl}/trends?days=${days}`).pipe(
      catchError((error) => {
        console.error('Error fetching trends:', error);
        return throwError(() => new Error('Something went wrong while fetching trends.'));
      })
    );
  }
}

export interface ExpenseAnalytics {
  total: number;
  count: number;
  average: number;
  topCategories: CategoryTotal[];

  getTrends(days: number = 7): Observable<ExpenseTrends> {
    return this.http.get<ExpenseTrends>(`${this.apiUrl}/trends?days=${days}`).pipe(
      catchError((error) => {
        console.error('Error fetching trends:', error);
        return throwError(() => new Error('Something went wrong while fetching trends.'));
      })
    );
  }
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

  getTrends(days: number = 7): Observable<ExpenseTrends> {
    return this.http.get<ExpenseTrends>(`${this.apiUrl}/trends?days=${days}`).pipe(
      catchError((error) => {
        console.error('Error fetching trends:', error);
        return throwError(() => new Error('Something went wrong while fetching trends.'));
      })
    );
  }
}
