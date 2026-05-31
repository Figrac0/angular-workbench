import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';

/**
 * Application shell: persistent navigation + footer wrapping the routed
 * feature pages.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main class="app-main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [
    `
      .app-main {
        max-width: 1180px;
        margin: 0 auto;
        padding: 2rem 1.25rem;
        min-height: calc(100vh - 220px);
      }
    `,
  ],
})
export class AppComponent {}
