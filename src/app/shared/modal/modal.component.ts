import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-root">
      <div class="backdrop" (click)="onBackdrop()"></div>
      <div class="dialog" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="close" (click)="close.emit()" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() dismissOnBackdrop = true;
  @Output() close = new EventEmitter<void>();

  onBackdrop() {
    if (this.dismissOnBackdrop) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }
}
