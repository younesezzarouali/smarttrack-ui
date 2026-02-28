import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HabitService } from '../../services/habit.service';

@Component({
  selector: 'app-create-habit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-habit-modal.html'
})
export class CreateHabitModalComponent {
  activeModal = inject(NgbActiveModal);
  private habitService = inject(HabitService);

  name = signal('');
  type = signal<'TIME' | 'COUNT'>('TIME');
  target = signal<number>(15);
  category = signal('HEALTH');
  
  loading = signal(false);

  create() {
    if (!this.name() || this.target() <= 0) return;

    this.loading.set(true);
    const newHabit = {
      name: this.name(),
      type: this.type(),
      target: this.target(),
      category: this.category(),
      frequency: 'DAILY'
    };

    this.habitService.createHabit(newHabit).subscribe({
      next: () => {
        this.loading.set(false);
        this.activeModal.close('success');
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}
