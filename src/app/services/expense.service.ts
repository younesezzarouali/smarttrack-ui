import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/expenses/summary`);
  }

  getExpenses(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/expenses`);
  }
}
