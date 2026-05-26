import { Component, computed, inject, signal } from '@angular/core';
import { TeamsService } from '../../services/teams.service';
import { UsersService } from '../../services/users.service';
import { TasksService } from '../../services/tasks.service';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { TeamFormComponent } from '../../components/team-form/team-form.component';
import { ConfirmComponent } from '../../shared/confirm/confirm.component';
import { NewTeamData, Team } from '../../models';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [BadgeComponent, TeamFormComponent, ConfirmComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent {
  protected readonly teamsSvc = inject(TeamsService);
  protected readonly usersSvc = inject(UsersService);
  protected readonly tasksSvc = inject(TasksService);

  protected readonly showForm = signal(false);
  protected readonly editing = signal<Team | null>(null);
  protected readonly deleting = signal<Team | null>(null);

  protected readonly rows = computed(() => {
    return this.teamsSvc.teams().map((team) => {
      const members = this.usersSvc.users().filter((u) => u.teamId === team.id);
      const tasks = this.tasksSvc.tasks().filter((t) => t.teamId === team.id);
      const open = tasks.filter((t) => t.status !== 'done').length;
      const today = new Date().toISOString().slice(0, 10);
      const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today).length;
      return { team, members, tasks, open, overdue };
    });
  });

  openCreate(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  openEdit(t: Team): void {
    this.editing.set(t);
    this.showForm.set(true);
  }

  save(data: NewTeamData): void {
    const ed = this.editing();
    if (ed) this.teamsSvc.update(ed.id, data);
    else this.teamsSvc.add(data);
    this.showForm.set(false);
    this.editing.set(null);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  askDelete(t: Team): void {
    this.deleting.set(t);
  }

  confirmDelete(): void {
    const t = this.deleting();
    if (!t) return;
    this.usersSvc.removeTeamReference(t.id);
    this.tasksSvc.clearTeam(t.id);
    this.teamsSvc.remove(t.id);
    this.deleting.set(null);
  }

  avatarPath(name: string): string {
    return 'assets/users/' + name;
  }
}
