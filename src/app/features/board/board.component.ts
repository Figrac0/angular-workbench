import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { TeamsService } from '../../services/teams.service';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { TaskFormComponent } from '../../components/task-form/task-form.component';
import { TaskDetailComponent } from '../../components/task-detail/task-detail.component';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import {
  NewTaskData,
  PRIORITY_LABEL,
  STATUS_LABEL,
  Task,
  TaskPriority,
  TaskStatus,
} from '../../models';

interface Column {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    BadgeComponent,
    TaskFormComponent,
    TaskDetailComponent,
    ConfirmComponent,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent {
  protected readonly tasksSvc = inject(TasksService);
  protected readonly usersSvc = inject(UsersService);
  protected readonly teamsSvc = inject(TeamsService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly priorityLabel = PRIORITY_LABEL;
  protected readonly priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  protected readonly statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];

  protected readonly search = signal('');
  protected readonly assigneeFilter = signal<string>('all');
  protected readonly teamFilter = signal<string>('all');
  protected readonly priorityFilter = signal<string>('all');
  protected readonly view = signal<'board' | 'list'>('board');

  protected readonly showCreate = signal(false);
  protected readonly editingTask = signal<Task | null>(null);
  protected readonly viewingId = signal<string | null>(null);
  protected readonly deleting = signal<Task | null>(null);

  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const a = this.assigneeFilter();
    const team = this.teamFilter();
    const pri = this.priorityFilter();
    return this.tasksSvc.tasks().filter((t) => {
      if (a !== 'all') {
        if (a === 'unassigned' && t.assigneeId !== null) return false;
        if (a !== 'unassigned' && t.assigneeId !== a) return false;
      }
      if (team !== 'all') {
        if (team === 'none' && t.teamId !== null) return false;
        if (team !== 'none' && t.teamId !== team) return false;
      }
      if (pri !== 'all' && t.priority !== pri) return false;
      if (q) {
        const hay = [t.title, t.summary, ...t.tags].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  protected readonly columns = computed<Column[]>(() => {
    const list = this.filtered();
    return this.statuses.map((s) => ({
      status: s,
      label: STATUS_LABEL[s],
      tasks: list.filter((t) => t.status === s),
    }));
  });

  isOverdue(t: Task): boolean {
    return t.status !== 'done' && !!t.dueDate && t.dueDate < this.today;
  }

  assigneeName(id: string | null): string {
    return id ? (this.usersSvc.getById(id)?.name ?? 'Unknown') : 'Unassigned';
  }

  assigneeAvatar(id: string | null): string | null {
    const u = id ? this.usersSvc.getById(id) : null;
    return u ? 'assets/users/' + u.avatar : null;
  }

  teamColor(id: string | null): string | null {
    return id ? (this.teamsSvc.getById(id)?.color ?? null) : null;
  }

  teamName(id: string | null): string {
    return id ? (this.teamsSvc.getById(id)?.name ?? '') : '';
  }

  clearFilters(): void {
    this.search.set('');
    this.assigneeFilter.set('all');
    this.teamFilter.set('all');
    this.priorityFilter.set('all');
  }

  advance(t: Task): void {
    const order: TaskStatus[] = ['todo', 'in-progress', 'review', 'done'];
    const idx = order.indexOf(t.status);
    if (idx < order.length - 1) this.tasksSvc.setStatus(t.id, order[idx + 1]);
  }

  reopen(t: Task): void {
    this.tasksSvc.setStatus(t.id, 'in-progress');
  }

  saveCreate(data: NewTaskData): void {
    this.tasksSvc.add(data);
    this.showCreate.set(false);
  }

  saveEdit(data: NewTaskData): void {
    const t = this.editingTask();
    if (t) this.tasksSvc.edit(t.id, data);
    this.editingTask.set(null);
  }

  startEdit(t: Task): void {
    this.viewingId.set(null);
    this.editingTask.set(t);
  }

  askDelete(t: Task): void {
    this.viewingId.set(null);
    this.deleting.set(t);
  }

  confirmDelete(): void {
    const t = this.deleting();
    if (t) this.tasksSvc.remove(t.id);
    this.deleting.set(null);
  }
}
