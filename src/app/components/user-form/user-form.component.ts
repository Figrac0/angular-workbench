import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AVATAR_OPTIONS, NewUserData, ROLE_LABEL, User, UserRole } from '../../models';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent implements OnInit {
  @Input() user?: User;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewUserData>();

  protected readonly teams = inject(TeamsService);
  protected readonly avatars = AVATAR_OPTIONS;
  protected readonly roles: UserRole[] = ['lead', 'senior', 'middle', 'junior', 'designer', 'qa', 'pm'];
  protected readonly roleLabel = ROLE_LABEL;

  name = '';
  email = '';
  avatar = AVATAR_OPTIONS[0];
  role: UserRole = 'middle';
  teamId: string | null = null;
  errors: string[] = [];

  ngOnInit(): void {
    if (this.user) {
      this.name = this.user.name;
      this.email = this.user.email;
      this.avatar = this.user.avatar;
      this.role = this.user.role;
      this.teamId = this.user.teamId;
    }
  }

  get heading(): string {
    return this.user ? 'Edit team member' : 'Add team member';
  }

  avatarPath(av: string): string {
    return 'assets/users/' + av;
  }

  submit(): void {
    this.errors = [];
    if (!this.name.trim()) this.errors.push('Name is required');
    if (!this.email.trim() || !this.email.includes('@')) this.errors.push('Valid email is required');
    if (this.errors.length) return;
    this.save.emit({
      name: this.name,
      email: this.email,
      avatar: this.avatar,
      role: this.role,
      teamId: this.teamId,
    });
  }
}
