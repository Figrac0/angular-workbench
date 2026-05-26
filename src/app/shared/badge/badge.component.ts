import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge-' + variant">
    <ng-content />
  </span>`,
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  @Input() variant: string = 'neutral';
}
