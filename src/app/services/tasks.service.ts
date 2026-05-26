import { Injectable, computed, signal } from '@angular/core';
import {
  HistoryAction,
  HistoryEntry,
  NewTaskData,
  Task,
  TaskPriority,
  TaskStatus,
} from '../models';
import { SEED_TASKS } from '../data/seed-data';

const STORAGE_KEY = 'easytask.tasks';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly _tasks = signal<Task[]>(this.load());

  readonly tasks = computed(() => this._tasks());

  readonly stats = computed(() => {
    const list = this._tasks();
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: list.length,
      todo: list.filter((t) => t.status === 'todo').length,
      inProgress: list.filter((t) => t.status === 'in-progress').length,
      review: list.filter((t) => t.status === 'review').length,
      done: list.filter((t) => t.status === 'done').length,
      overdue: list.filter(
        (t) => t.status !== 'done' && t.dueDate && t.dueDate < today,
      ).length,
    };
  });

  getById(id: string): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  forUser(userId: string): Task[] {
    return this._tasks().filter((t) => t.assigneeId === userId);
  }

  forTeam(teamId: string): Task[] {
    return this._tasks().filter((t) => t.teamId === teamId);
  }

  add(data: NewTaskData, actorId: string | null = null): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: 'task-' + Date.now().toString(36),
      title: data.title.trim(),
      summary: data.summary.trim(),
      dueDate: data.dueDate,
      status: 'todo',
      priority: data.priority,
      assigneeId: data.assigneeId,
      teamId: data.teamId,
      tags: [...data.tags],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      history: [this.entry('created', actorId)],
    };
    this._tasks.update((list) => [task, ...list]);
    this.persist();
    return task;
  }

  edit(id: string, data: NewTaskData, actorId: string | null = null): void {
    const now = new Date().toISOString();
    this._tasks.update((list) =>
      list.map((t) => {
        if (t.id !== id) return t;
        const additions: HistoryEntry[] = [];
        if (t.title !== data.title.trim())
          additions.push(this.entry('title-changed', actorId, t.title, data.title.trim()));
        if (t.summary !== data.summary.trim())
          additions.push(this.entry('summary-changed', actorId));
        if (t.dueDate !== data.dueDate)
          additions.push(this.entry('due-date-changed', actorId, t.dueDate, data.dueDate));
        if (t.priority !== data.priority)
          additions.push(this.entry('priority-changed', actorId, t.priority, data.priority));
        if ((t.assigneeId ?? '') !== (data.assigneeId ?? ''))
          additions.push(
            this.entry('assignee-changed', actorId, t.assigneeId ?? '—', data.assigneeId ?? '—'),
          );
        if ((t.teamId ?? '') !== (data.teamId ?? ''))
          additions.push(this.entry('team-changed', actorId, t.teamId ?? '—', data.teamId ?? '—'));

        return {
          ...t,
          title: data.title.trim(),
          summary: data.summary.trim(),
          dueDate: data.dueDate,
          priority: data.priority,
          assigneeId: data.assigneeId,
          teamId: data.teamId,
          tags: [...data.tags],
          updatedAt: now,
          history: [...t.history, ...additions],
        };
      }),
    );
    this.persist();
  }

  setStatus(id: string, status: TaskStatus, actorId: string | null = null): void {
    const now = new Date().toISOString();
    this._tasks.update((list) =>
      list.map((t) => {
        if (t.id !== id || t.status === status) return t;
        const wasDone = t.status === 'done';
        const additions: HistoryEntry[] = [
          this.entry('status-changed', actorId, t.status, status),
        ];
        if (status === 'done') additions.push(this.entry('completed', actorId));
        if (wasDone && status !== 'done') additions.push(this.entry('reopened', actorId));
        return {
          ...t,
          status,
          completedAt: status === 'done' ? now : null,
          updatedAt: now,
          history: [...t.history, ...additions],
        };
      }),
    );
    this.persist();
  }

  setPriority(id: string, priority: TaskPriority, actorId: string | null = null): void {
    this._tasks.update((list) =>
      list.map((t) => {
        if (t.id !== id || t.priority === priority) return t;
        return {
          ...t,
          priority,
          updatedAt: new Date().toISOString(),
          history: [...t.history, this.entry('priority-changed', actorId, t.priority, priority)],
        };
      }),
    );
    this.persist();
  }

  reassign(id: string, assigneeId: string | null, actorId: string | null = null): void {
    this._tasks.update((list) =>
      list.map((t) => {
        if (t.id !== id || (t.assigneeId ?? '') === (assigneeId ?? '')) return t;
        return {
          ...t,
          assigneeId,
          updatedAt: new Date().toISOString(),
          history: [
            ...t.history,
            this.entry('assignee-changed', actorId, t.assigneeId ?? '—', assigneeId ?? '—'),
          ],
        };
      }),
    );
    this.persist();
  }

  remove(id: string): void {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
    this.persist();
  }

  unassignUser(userId: string): void {
    this._tasks.update((list) =>
      list.map((t) => (t.assigneeId === userId ? { ...t, assigneeId: null } : t)),
    );
    this.persist();
  }

  clearTeam(teamId: string): void {
    this._tasks.update((list) =>
      list.map((t) => (t.teamId === teamId ? { ...t, teamId: null } : t)),
    );
    this.persist();
  }

  private entry(
    action: HistoryAction,
    actorId: string | null = null,
    from?: string,
    to?: string,
  ): HistoryEntry {
    return {
      id: 'h-' + Math.random().toString(36).slice(2, 9),
      action,
      at: new Date().toISOString(),
      byUserId: actorId,
      from,
      to,
    };
  }

  private load(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Task[];
    } catch {}
    return [...SEED_TASKS];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._tasks()));
  }
}
