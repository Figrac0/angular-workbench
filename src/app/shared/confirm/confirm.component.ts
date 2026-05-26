import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [title]="title" (close)="cancel.emit()">
      <p class="message">{{ message }}</p>
      <div class="actions">
        <button type="button" class="btn-ghost" (click)="cancel.emit()">{{ cancelLabel }}</button>
        <button type="button" class="btn-danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .message { margin: 0 0 1.25rem; line-height: 1.5; color: #d6c4ec; }
      .actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
      button { font: inherit; cursor: pointer; padding: 0.5rem 1.25rem; border-radius: 6px; border: none; }
      .btn-ghost { background: transparent; color: #c3b3d8; border: 1px solid rgba(195, 179, 216, 0.25); }
      .btn-ghost:hover { background: rgba(195, 179, 216, 0.08); }
      .btn-danger { background: #b94a6a; color: #fff; font-weight: 600; }
      .btn-danger:hover { background: #d65a7c; }
    `,
  ],
})
export class ConfirmComponent {
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
