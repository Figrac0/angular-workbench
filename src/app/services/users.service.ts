import { Injectable, computed, signal } from '@angular/core';
import { NewUserData, User } from '../models';
import { SEED_USERS } from '../data/seed-data';

const STORAGE_KEY = 'easytask.users';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly _users = signal<User[]>(this.load());

  readonly users = computed(() => this._users());
  readonly activeUsers = computed(() => this._users().filter((u) => u.active));

  getById(id: string | null): User | undefined {
    if (!id) return undefined;
    return this._users().find((u) => u.id === id);
  }

  byTeam(teamId: string | null): User[] {
    return this._users().filter((u) => u.teamId === teamId);
  }

  add(data: NewUserData): User {
    const user: User = {
      id: 'u-' + Date.now().toString(36),
      name: data.name.trim(),
      email: data.email.trim(),
      avatar: data.avatar,
      role: data.role,
      teamId: data.teamId,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this._users.update((list) => [user, ...list]);
    this.persist();
    return user;
  }

  update(id: string, data: NewUserData): void {
    this._users.update((list) =>
      list.map((u) =>
        u.id === id
          ? {
              ...u,
              name: data.name.trim(),
              email: data.email.trim(),
              avatar: data.avatar,
              role: data.role,
              teamId: data.teamId,
            }
          : u,
      ),
    );
    this.persist();
  }

  setActive(id: string, active: boolean): void {
    this._users.update((list) => list.map((u) => (u.id === id ? { ...u, active } : u)));
    this.persist();
  }

  remove(id: string): void {
    this._users.update((list) => list.filter((u) => u.id !== id));
    this.persist();
  }

  removeTeamReference(teamId: string): void {
    this._users.update((list) =>
      list.map((u) => (u.teamId === teamId ? { ...u, teamId: null } : u)),
    );
    this.persist();
  }

  private load(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as User[];
    } catch {}
    return [...SEED_USERS];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._users()));
  }
}
