import { Routes } from '@angular/router';

/**
 * Feature routes are lazily loaded so each section ships in its own chunk,
 * keeping the initial bundle small.
 */
export const routes: Routes = [
  {
    path: 'calculator',
    title: 'Investment Calculator',
    loadComponent: () =>
      import('./features/calculator/calculator.component').then(
        (m) => m.CalculatorComponent,
      ),
  },
  {
    path: 'converter',
    title: 'Currency Converter',
    loadComponent: () =>
      import('./features/converter/converter.component').then(
        (m) => m.ConverterComponent,
      ),
  },
  {
    path: 'crypto',
    title: 'Crypto Market',
    loadComponent: () =>
      import('./features/crypto/crypto.component').then(
        (m) => m.CryptoComponent,
      ),
  },
  { path: '', redirectTo: 'calculator', pathMatch: 'full' },
  { path: '**', redirectTo: 'calculator' },
];
