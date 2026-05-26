import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { NewTaskData, PRIORITY_LABEL, Task, TaskPriority } from '../../models';
import { UsersService } from '../../services/users.service';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Input() defaultAssigneeId: string | null = null;
  @Input() defaultTeamId: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewTaskData>();

  protected readonly users = inject(UsersService);
  protected readonly teams = inject(TeamsService);

  protected readonly priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  protected readonly priorityLabel = PRIORITY_LABEL;

  title = '';
  summary = '';
  dueDate = '';
  priority: TaskPriority = 'medium';
  assigneeId: string | null = null;
  teamId: string | null = null;
  tagsInput = '';
  errors: string[] = [];

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title;
      this.summary = this.task.summary;
      this.dueDate = this.task.dueDate;
      this.priority = this.task.priority;
      this.assigneeId = this.task.assigneeId;
      this.teamId = this.task.teamId;
      this.tagsInput = this.task.tags.join(', ');
    } else {
      this.assigneeId = this.defaultAssigneeId;
      this.teamId = this.defaultTeamId;
      const d = new Date();
      d.setDate(d.getDate() + 7);
      this.dueDate = d.toISOString().slice(0, 10);
    }
  }

  get heading(): string {
    return this.task ? 'Edit Task' : 'Create Task';
  }

  onAssigneeChange(value: string): void {
    this.assigneeId = value || null;
    const user = this.users.getById(this.assigneeId);
    if (user && !this.teamId) this.teamId = user.teamId;
  }

  submit(): void {
    this.errors = [];
    if (!this.title.trim()) this.errors.push('Title is required');
    if (!this.dueDate) this.errors.push('Due date is required');
    if (!this.assigneeId && !this.teamId)
      this.errors.push('Pick an assignee or a team — at least one is required');
    if (this.errors.length) return;

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    this.save.emit({
      title: this.title,
      summary: this.summary,
      dueDate: this.dueDate,
      priority: this.priority,
      assigneeId: this.assigneeId,
      teamId: this.teamId,
      tags,
    });
  }
}
