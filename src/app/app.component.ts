import { Component, computed, inject, signal } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BoardComponent } from './features/board/board.component';
import { MembersComponent } from './features/members/members.component';
import { TeamsComponent } from './features/teams/teams.component';
import { TasksService } from './services/tasks.service';
import { UsersService } from './services/users.service';
import { TeamsService } from './services/teams.service';

type ViewKey = 'dashboard' | 'board' | 'members' | 'teams';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    DashboardComponent,
    BoardComponent,
    MembersComponent,
    TeamsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly tasksSvc = inject(TasksService);
  protected readonly usersSvc = inject(UsersService);
  protected readonly teamsSvc = inject(TeamsService);

  protected readonly view = signal<ViewKey>('dashboard');

  protected readonly tabs: Array<{ key: ViewKey; label: string; icon: string }> = [
    { key: 'dashboard', label: 'Dashboard', icon: '◇' },
    { key: 'board', label: 'Tasks', icon: '☷' },
    { key: 'members', label: 'Members', icon: '◉' },
    { key: 'teams', label: 'Teams', icon: '◈' },
  ];

  protected readonly badges = computed(() => ({
    dashboard: this.tasksSvc.stats().overdue,
    board: this.tasksSvc.stats().total,
    members: this.usersSvc.users().length,
    teams: this.teamsSvc.teams().length,
  }));
}
