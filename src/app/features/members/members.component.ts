import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { TeamsService } from '../../services/teams.service';
import { TasksService } from '../../services/tasks.service';
import { CardComponent } from '../../shared/card/card.component';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import { TaskDetailComponent } from '../../components/task-detail/task-detail.component';
import { TaskFormComponent } from '../../components/task-form/task-form.component';
import { NewUserData, NewTaskData, ROLE_LABEL, STATUS_LABEL, Task, User, PRIORITY_LABEL } from '../../models';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    CardComponent,
    BadgeComponent,
    UserFormComponent,
    ConfirmComponent,
    TaskDetailComponent,
    TaskFormComponent,
  ],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css',
})
export class MembersComponent {
  protected readonly usersSvc = inject(UsersService);
  protected readonly teamsSvc = inject(TeamsService);
  protected readonly tasksSvc = inject(TasksService);

  protected readonly roleLabel = ROLE_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly priorityLabel = PRIORITY_LABEL;

  protected readonly search = signal('');
  protected readonly teamFilter = signal<string>('all');
  protected readonly selectedUserId = signal<string | null>(null);

  protected readonly showForm = signal(false);
  protected readonly editing = signal<User | null>(null);
  protected readonly deleting = signal<User | null>(null);

  protected readonly viewingTaskId = signal<string | null>(null);
  protected readonly editingTask = signal<Task | null>(null);
  protected readonly deletingTask = signal<Task | null>(null);
  protected readonly newTaskForUser = signal<User | null>(null);

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const team = this.teamFilter();
    return this.usersSvc.users().filter((u) => {
      if (team !== 'all' && (u.teamId ?? 'none') !== team) return false;
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
      return true;
    });
  });

  protected readonly selectedUser = computed(() => {
    const id = this.selectedUserId();
    return id ? this.usersSvc.getById(id) : null;
  });

  protected readonly userTasks = computed(() => {
    const u = this.selectedUser();
    if (!u) return [];
    return this.tasksSvc.forUser(u.id);
  });

  taskCount(userId: string): number {
    return this.tasksSvc.tasks().filter((t) => t.assigneeId === userId && t.status !== 'done').length;
  }

  teamColor(id: string | null): string {
    return id ? (this.teamsSvc.getById(id)?.color ?? '#9965dd') : '#564a6c';
  }

  teamName(id: string | null): string {
    return id ? (this.teamsSvc.getById(id)?.name ?? 'No team') : 'Unassigned';
  }

  avatarPath(u: User): string {
    return 'assets/users/' + u.avatar;
  }

  openCreate(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  openEdit(u: User): void {
    this.editing.set(u);
    this.showForm.set(true);
  }

  saveUser(data: NewUserData): void {
    const ed = this.editing();
    if (ed) this.usersSvc.update(ed.id, data);
    else this.usersSvc.add(data);
    this.showForm.set(false);
    this.editing.set(null);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  toggleActive(u: User): void {
    this.usersSvc.setActive(u.id, !u.active);
  }

  askDelete(u: User): void {
    this.deleting.set(u);
  }

  confirmDelete(): void {
    const u = this.deleting();
    if (!u) return;
    this.tasksSvc.unassignUser(u.id);
    this.usersSvc.remove(u.id);
    if (this.selectedUserId() === u.id) this.selectedUserId.set(null);
    this.deleting.set(null);
  }

  selectUser(id: string): void {
    this.selectedUserId.set(this.selectedUserId() === id ? null : id);
  }

  openTask(t: Task): void {
    this.viewingTaskId.set(t.id);
  }

  startEditTask(t: Task): void {
    this.viewingTaskId.set(null);
    this.editingTask.set(t);
  }

  saveTaskEdit(data: NewTaskData): void {
    const ed = this.editingTask();
    if (ed) this.tasksSvc.edit(ed.id, data);
    this.editingTask.set(null);
  }

  startCreateTask(u: User): void {
    this.newTaskForUser.set(u);
  }

  saveTaskCreate(data: NewTaskData): void {
    this.tasksSvc.add(data);
    this.newTaskForUser.set(null);
  }

  askDeleteTask(t: Task): void {
    this.viewingTaskId.set(null);
    this.deletingTask.set(t);
  }

  confirmDeleteTask(): void {
    const t = this.deletingTask();
    if (t) this.tasksSvc.remove(t.id);
    this.deletingTask.set(null);
  }
}
