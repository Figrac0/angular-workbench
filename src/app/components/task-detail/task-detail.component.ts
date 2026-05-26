import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import {
  HistoryAction,
  PRIORITY_LABEL,
  STATUS_LABEL,
  Task,
  TaskPriority,
  TaskStatus,
} from '../../models';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [ModalComponent, BadgeComponent, DatePipe],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
})
export class TaskDetailComponent {
  @Input({ required: true }) taskId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Task>();
  @Output() remove = new EventEmitter<Task>();

  protected readonly tasksService = inject(TasksService);
  protected readonly usersService = inject(UsersService);
  protected readonly teamsService = inject(TeamsService);

  protected readonly statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly priorityLabel = PRIORITY_LABEL;

  protected readonly task = computed(() =>
    this.tasksService.tasks().find((t) => t.id === this.taskId),
  );

  protected readonly isOverdue = computed(() => {
    const t = this.task();
    if (!t || t.status === 'done' || !t.dueDate) return false;
    return t.dueDate < new Date().toISOString().slice(0, 10);
  });

  setStatus(status: TaskStatus): void {
    this.tasksService.setStatus(this.taskId, status);
  }

  setPriority(p: TaskPriority): void {
    this.tasksService.setPriority(this.taskId, p);
  }

  assigneeName(id: string | null): string {
    return id ? (this.usersService.getById(id)?.name ?? 'Unknown') : 'Unassigned';
  }

  teamName(id: string | null): string {
    return id ? (this.teamsService.getById(id)?.name ?? 'Unknown') : 'No team';
  }

  describe(action: HistoryAction, from?: string, to?: string): string {
    switch (action) {
      case 'created': return 'Created task';
      case 'completed': return 'Marked complete';
      case 'reopened': return 'Reopened task';
      case 'status-changed':
        return `Status: ${this.statusLabel[from as TaskStatus] ?? from} → ${this.statusLabel[to as TaskStatus] ?? to}`;
      case 'priority-changed':
        return `Priority: ${this.priorityLabel[from as TaskPriority] ?? from} → ${this.priorityLabel[to as TaskPriority] ?? to}`;
      case 'assignee-changed': {
        const f = from && from !== '—' ? this.assigneeName(from) : 'Unassigned';
        const t = to && to !== '—' ? this.assigneeName(to) : 'Unassigned';
        return `Assignee: ${f} → ${t}`;
      }
      case 'team-changed': {
        const f = from && from !== '—' ? this.teamName(from) : 'No team';
        const t = to && to !== '—' ? this.teamName(to) : 'No team';
        return `Team: ${f} → ${t}`;
      }
      case 'due-date-changed': return `Due date: ${from} → ${to}`;
      case 'title-changed': return `Title updated`;
      case 'summary-changed': return 'Summary updated';
      default: return action;
    }
  }
}
