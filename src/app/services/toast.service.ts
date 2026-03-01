import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  message = signal<string | null>(null);

  show(msg: string, duration = 3000) {
    this.message.set(msg);
    setTimeout(() => {
      if (this.message() === msg) {
        this.message.set(null);
      }
    }, duration);
  }
}
