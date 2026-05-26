import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { NewTeamData, TEAM_COLORS, Team } from '../../models';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.css',
})
export class TeamFormComponent implements OnInit {
  @Input() team?: Team;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewTeamData>();

  protected readonly colors = TEAM_COLORS;

  name = '';
  description = '';
  color = TEAM_COLORS[0];
  errors: string[] = [];

  ngOnInit(): void {
    if (this.team) {
      this.name = this.team.name;
      this.description = this.team.description;
      this.color = this.team.color;
    }
  }

  get heading(): string {
    return this.team ? 'Edit team' : 'Create team';
  }

  submit(): void {
    this.errors = [];
    if (!this.name.trim()) this.errors.push('Team name is required');
    if (this.errors.length) return;
    this.save.emit({ name: this.name, description: this.description, color: this.color });
  }
}
