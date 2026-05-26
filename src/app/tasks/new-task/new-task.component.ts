import { Component, Output, EventEmitter, inject, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NewTaskData } from '../task/task.model';
import { TasksService } from '../tasks.service';

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css',
})
export class NewTaskComponent {
  @Input({ required: true }) userId!: string;

  @Output() close = new EventEmitter<void>();

  @Output() add = new EventEmitter<NewTaskData>();

  enteredTitle = '';
  // enteredTitle = signal('');
  enteredSummary = '';
  // enteredSummary = signal('');
  enteredDueDate = '';
  // enteredDueDate = signal('');

  private taskService = inject(TasksService);
  onCancel() {
    this.close.emit();
  }

  onSubmit() {
    this.taskService.addTask(
      {
        title: this.enteredTitle,
        summary: this.enteredSummary,
        dueDate: this.enteredDueDate,
      },
      this.userId,
    );
    this.close.emit();
  }
}
