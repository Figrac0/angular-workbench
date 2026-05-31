import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom, app-styled dropdown that replaces the native `<select>`.
 * Implements ControlValueAccessor (works with `formControlName` and `ngModel`),
 * supports keyboard navigation, click-outside dismissal and an optional
 * type-ahead search for long lists (e.g. currencies).
 */
@Component({
  selector: 'app-select',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      class="sel__trigger"
      [class.is-open]="open()"
      [class.is-compact]="compact()"
      [disabled]="disabled()"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      @if (leadingIcon()) {
        <span class="sel__icon">{{ leadingIcon() }}</span>
      }
      <span class="sel__label" [class.is-placeholder]="!value()">
        {{ selectedLabel() }}
      </span>
      <svg class="sel__chev" viewBox="0 0 10 6" width="11" height="7">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    @if (open()) {
      <div class="sel__panel" role="listbox">
        @if (searchable()) {
          <div class="sel__search">
            <input
              #search
              type="text"
              placeholder="Search…"
              [value]="query()"
              (input)="onSearch($any($event.target).value)"
              (keydown)="onSearchKeydown($event)"
            />
          </div>
        }
        <ul class="sel__list">
          @for (opt of filtered(); track opt.value; let i = $index) {
            <li
              role="option"
              class="sel__option"
              [class.is-active]="i === activeIndex()"
              [class.is-selected]="opt.value === value()"
              [attr.aria-selected]="opt.value === value()"
              (mouseenter)="activeIndex.set(i)"
              (click)="choose(opt.value)"
            >
              <span>{{ opt.label }}</span>
              @if (opt.value === value()) {
                <span class="sel__check">✓</span>
              }
            </li>
          } @empty {
            <li class="sel__empty">No matches</li>
          }
        </ul>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
      .sel__trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        height: 44px;
        padding: 0 0.7rem;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 11px;
        color: var(--text);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .sel__trigger.is-compact {
        height: 40px;
        border-radius: 10px;
        padding: 0 0.6rem;
        font-size: 0.88rem;
      }
      .sel__trigger:hover {
        border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
      }
      .sel__trigger.is-open,
      .sel__trigger:focus-visible {
        outline: none;
        border-color: var(--brand);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 16%, transparent);
      }
      .sel__icon {
        font-size: 0.9rem;
      }
      .sel__label {
        flex: 1;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sel__label.is-placeholder {
        color: var(--text-muted);
        font-weight: 500;
      }
      .sel__chev {
        color: var(--text-muted);
        transition: transform 0.18s ease;
        flex-shrink: 0;
      }
      .sel__trigger.is-open .sel__chev {
        transform: rotate(180deg);
        color: var(--brand);
      }

      .sel__panel {
        position: absolute;
        z-index: 60;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        animation: sel-in 0.14s ease;
      }
      @keyframes sel-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
      .sel__search {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border);
      }
      .sel__search input {
        height: 36px;
        border-radius: 8px;
      }
      .sel__list {
        list-style: none;
        margin: 0;
        padding: 0.35rem;
        max-height: 240px;
        overflow-y: auto;
      }
      .sel__option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.55rem 0.65rem;
        border-radius: 8px;
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
      }
      .sel__option.is-active {
        background: var(--surface-2);
      }
      .sel__option.is-selected {
        color: var(--brand);
        font-weight: 700;
      }
      .sel__check {
        color: var(--brand);
      }
      .sel__empty {
        padding: 0.7rem;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class SelectComponent implements ControlValueAccessor {
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input<string>('Select');
  readonly searchable = input<boolean>(false);
  readonly leadingIcon = input<string>('');
  readonly compact = input<boolean>(false);

  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);
  protected readonly value = signal<string>('');
  protected readonly disabled = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly filtered = computed<SelectOption[]>(() => {
    const t = this.query().trim().toLowerCase();
    const opts = this.options();
    if (!t) {
      return opts;
    }
    return opts.filter(
      (o) =>
        o.label.toLowerCase().includes(t) ||
        o.value.toLowerCase().includes(t),
    );
  });

  protected readonly selectedLabel = computed(() => {
    const found = this.options().find((o) => o.value === this.value());
    return found ? found.label : this.placeholder();
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: string): void {
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- Open / close ----
  protected toggle(): void {
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    if (this.disabled()) {
      return;
    }
    this.query.set('');
    const idx = this.filtered().findIndex((o) => o.value === this.value());
    this.activeIndex.set(idx >= 0 ? idx : 0);
    this.open.set(true);
  }

  private close(): void {
    if (this.open()) {
      this.open.set(false);
      this.onTouched();
    }
  }

  protected choose(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.close();
  }

  protected onSearch(q: string): void {
    this.query.set(q);
    this.activeIndex.set(0);
  }

  // ---- Keyboard ----
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (
      !this.open() &&
      (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')
    ) {
      event.preventDefault();
      this.openPanel();
      return;
    }
    this.handleListKeys(event);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    this.handleListKeys(event);
  }

  private handleListKeys(event: KeyboardEvent): void {
    if (!this.open()) {
      return;
    }
    const items = this.filtered();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        event.preventDefault();
        const opt = items[this.activeIndex()];
        if (opt) {
          this.choose(opt.value);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.open() && !this.host.nativeElement.contains(target)) {
      this.close();
    }
  }
}
