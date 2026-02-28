import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface LifeEvent {
  userId: string;
  timestamp: number;
  type: 'FINANCE' | 'HEALTH' | 'WORK' | 'HABIT' | 'NOTE';
  content: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class LifeService {
  private apiUrl = `${environment.apiUrl}/life`;

  constructor(private http: HttpClient) {}

  sendMagicInput(text: string): Observable<LifeEvent[]> {
    return this.http.post<LifeEvent[]>(`${this.apiUrl}/magic`, { text });
  }

  getEvents(): Observable<LifeEvent[]> {
    return this.http.get<LifeEvent[]>(`${this.apiUrl}/events`);
  }

  clearEvents(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events`);
  }
}
