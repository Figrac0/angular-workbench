import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CurrencyService } from '../../core/services/currency.service';
import { ThemeService } from '../../core/services/theme.service';
import { POPULAR_CURRENCIES } from '../../core/models/currency.model';
import {
  SelectComponent,
  SelectOption,
} from '../../shared/components/select/select.component';

/**
 * Sticky top navigation: brand, section links, a global display-currency
 * selector (shared via {@link CurrencyService}) and a light/dark toggle.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, SelectComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  protected readonly currencyService = inject(CurrencyService);

  protected readonly theme = this.themeService.theme;
  protected readonly currencies = signal<string[]>(POPULAR_CURRENCIES);
  protected readonly currencyOptions = computed<SelectOption[]>(() =>
    this.currencies().map((code) => ({ value: code, label: code })),
  );
  protected readonly menuOpen = signal(false);

  protected readonly links = [
    { path: '/calculator', label: 'Calculator', icon: ' ' },
    { path: '/converter', label: 'Converter', icon: '' },
    { path: '/crypto', label: 'Crypto', icon: '' },
  ];

  ngOnInit(): void {
    this.currencyService.getCurrencies().subscribe({
      next: (map) => this.currencies.set(Object.keys(map).sort()),
      error: () => this.currencies.set(POPULAR_CURRENCIES),
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected onCurrencyChange(code: string): void {
    this.currencyService.setDisplayCurrency(code);
  }
}
