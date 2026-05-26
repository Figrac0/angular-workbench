import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { TeamsService } from '../../services/teams.service';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { STATUS_LABEL, PRIORITY_LABEL, Task } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BadgeComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly tasksSvc = inject(TasksService);
  protected readonly usersSvc = inject(UsersService);
  protected readonly teamsSvc = inject(TeamsService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly priorityLabel = PRIORITY_LABEL;

  protected readonly stats = computed(() => this.tasksSvc.stats());

  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly upcoming = computed(() => {
    return this.tasksSvc
      .tasks()
      .filter((t) => t.status !== 'done')
      .slice()
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 5);
  });

  protected readonly recentlyCompleted = computed(() => {
    return this.tasksSvc
      .tasks()
      .filter((t) => t.status === 'done')
      .slice()
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
      .slice(0, 5);
  });

  protected readonly teamLoad = computed(() => {
    const teams = this.teamsSvc.teams();
    return teams.map((team) => {
      const tasks = this.tasksSvc.tasks().filter((t) => t.teamId === team.id);
      const open = tasks.filter((t) => t.status !== 'done').length;
      return {
        team,
        open,
        total: tasks.length,
        members: this.usersSvc.users().filter((u) => u.teamId === team.id).length,
      };
    });
  });

  isOverdue(t: Task): boolean {
    return t.status !== 'done' && !!t.dueDate && t.dueDate < this.today;
  }

  assigneeName(id: string | null): string {
    return id ? (this.usersSvc.getById(id)?.name ?? 'Unknown') : 'Unassigned';
  }
}
