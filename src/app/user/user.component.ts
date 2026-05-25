import { Component, EventEmitter, Input, Output } from '@angular/core';

import { User } from './user.model';

// type User = {
//   id: string;
//   name: string;
//   avatar: string;
// }
@Component({
  selector: 'app-user',
  standalone: true,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent {
  @Input({ required: true }) user!: User;
  // @Input({ required: true }) id!: string;
  // @Input({ required: true }) avatar!: string;
  // @Input({ required: true }) name!: string;
  // avatar = input.required<string>();
  // name = input.required<string>();

  @Output() select = new EventEmitter<string>();
  // select = output<string>();

  get imagePath() {
    return 'assets/users/' + this.user.avatar;
  }
  // imagePath = computed(() => {
  //   return 'assets/users/' + this.avatar();
  // });

  onSelectUser() {
    this.select.emit(this.user.id);
  }
}
