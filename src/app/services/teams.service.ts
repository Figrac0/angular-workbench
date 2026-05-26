import { Injectable, computed, signal } from '@angular/core';
import { NewTeamData, Team } from '../models';
import { SEED_TEAMS } from '../data/seed-data';

const STORAGE_KEY = 'easytask.teams';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly _teams = signal<Team[]>(this.load());

  readonly teams = computed(() => this._teams());

  getById(id: string | null): Team | undefined {
    if (!id) return undefined;
    return this._teams().find((t) => t.id === id);
  }

  add(data: NewTeamData): Team {
    const team: Team = {
      id: 't-' + Date.now().toString(36),
      name: data.name.trim(),
      description: data.description.trim(),
      color: data.color,
      createdAt: new Date().toISOString(),
    };
    this._teams.update((list) => [team, ...list]);
    this.persist();
    return team;
  }

  update(id: string, data: NewTeamData): void {
    this._teams.update((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, name: data.name.trim(), description: data.description.trim(), color: data.color }
          : t,
      ),
    );
    this.persist();
  }

  remove(id: string): void {
    this._teams.update((list) => list.filter((t) => t.id !== id));
    this.persist();
  }

  private load(): Team[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Team[];
    } catch {}
    return [...SEED_TEAMS];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._teams()));
  }
}
