import {
  Component,
  ElementRef,
  effect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Premium numeric input that works as a reactive-form / ngModel control
 * (ControlValueAccessor). Adds app-styled stepper buttons and mouse-wheel
 * scrolling, with the native browser spinner hidden for a consistent look.
 */
@Component({
  selector: 'app-number-field',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFieldComponent),
      multi: true,
    },
  ],
  template: `
    <div class="nf" [class.is-disabled]="disabled()">
      @if (prefix()) {
        <span class="nf__affix nf__prefix">{{ prefix() }}</span>
      }
      <input
        #input
        class="nf__input"
        type="number"
        inputmode="decimal"
        [id]="fieldId()"
        [attr.step]="step()"
        [attr.min]="min()"
        [attr.max]="max()"
        [disabled]="disabled()"
        (input)="onInput($any($event.target).value)"
        (blur)="onBlur()"
        (wheel)="onWheel($event)"
      />
      @if (suffix()) {
        <span class="nf__affix nf__suffix">{{ suffix() }}</span>
      }
      <div class="nf__steppers">
        <button
          type="button"
          tabindex="-1"
          class="nf__step"
          (click)="stepBy(1)"
          aria-label="Increase"
        >
          <svg viewBox="0 0 10 6" width="10" height="6"><path d="M1 5L5 1l4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button
          type="button"
          tabindex="-1"
          class="nf__step"
          (click)="stepBy(-1)"
          aria-label="Decrease"
        >
          <svg viewBox="0 0 10 6" width="10" height="6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .nf {
        display: flex;
        align-items: stretch;
        height: 44px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 11px;
        overflow: hidden;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .nf:focus-within {
        border-color: var(--brand);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 16%, transparent);
      }
      .nf.is-disabled {
        opacity: 0.55;
      }
      .nf__affix {
        display: inline-flex;
        align-items: center;
        padding: 0 0.55rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-muted);
        white-space: nowrap;
        user-select: none;
      }
      .nf__prefix {
        border-right: 1px solid var(--border);
      }
      .nf__suffix {
        border-left: 1px solid var(--border);
      }
      .nf__input {
        flex: 1;
        min-width: 0;
        width: 100%;
        border: none;
        background: transparent;
        padding: 0 0.7rem;
        font-size: 0.98rem;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: var(--text);
      }
      .nf__input:focus {
        outline: none;
        box-shadow: none;
      }
      /* hide native spinners */
      .nf__input::-webkit-outer-spin-button,
      .nf__input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .nf__input[type='number'] {
        -moz-appearance: textfield;
      }
      .nf__steppers {
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--border);
      }
      .nf__step {
        flex: 1;
        display: grid;
        place-items: center;
        width: 28px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .nf__step:first-child {
        border-bottom: 1px solid var(--border);
      }
      .nf__step:hover {
        background: color-mix(in srgb, var(--brand) 14%, transparent);
        color: var(--brand);
      }
      .nf__step:active {
        background: color-mix(in srgb, var(--brand) 24%, transparent);
      }
    `,
  ],
})
export class NumberFieldComponent implements ControlValueAccessor {
  readonly fieldId = input<string>('', { alias: 'id' });
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');
  readonly step = input<number>(1);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);

  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly value = signal<number>(0);
  protected readonly disabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Sync the DOM input from the model when it is not being edited.
    effect(() => {
      const el = this.inputRef()?.nativeElement;
      const v = this.value();
      if (el && document.activeElement !== el) {
        el.value = String(v);
      }
    });
  }

  // ---- ControlValueAccessor ----
  writeValue(v: number): void {
    this.value.set(v ?? 0);
  }
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- Interaction ----
  protected onInput(raw: string): void {
    const v = Number(raw);
    if (Number.isFinite(v)) {
      this.value.set(v);
      this.onChange(v);
    }
  }

  protected onBlur(): void {
    this.commit(this.clamp(this.value()), true);
    this.onTouched();
  }

  protected stepBy(dir: number): void {
    if (this.disabled()) {
      return;
    }
    this.commit(this.clamp(this.round(this.value() + dir * this.step())), true);
    this.onTouched();
  }

  protected onWheel(event: WheelEvent): void {
    if (this.disabled() || document.activeElement !== event.target) {
      return; // only scrub when the field is focused, to avoid hijacking page scroll
    }
    event.preventDefault();
    this.stepBy(event.deltaY < 0 ? 1 : -1);
  }

  private commit(v: number, writeDom: boolean): void {
    this.value.set(v);
    if (writeDom) {
      const el = this.inputRef()?.nativeElement;
      if (el) {
        el.value = String(v);
      }
    }
    this.onChange(v);
  }

  private clamp(v: number): number {
    const min = this.min();
    const max = this.max();
    let r = Number.isFinite(v) ? v : 0;
    if (min != null && r < min) r = min;
    if (max != null && r > max) r = max;
    return r;
  }

  private round(v: number): number {
    return Math.round(v * 1e6) / 1e6;
  }
}
