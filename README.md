# Angular — Working with Modules

A small demo project showing how to structure an Angular app with **NgModules**.
Generated with Angular CLI 17.1.2.

## What is an NgModule?

An `NgModule` is a container that groups related components, directives, pipes and
services. Every Angular app has at least one **root module** (`AppModule`) that
bootstraps the app. Larger apps are split into **feature modules** and **shared
modules** to keep code organized and reusable.

### The `@NgModule` metadata

| Property       | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `declarations` | Components, directives and pipes that **belong** to this module.        |
| `imports`      | Other modules whose exported features this module needs.                |
| `exports`      | Declarations made **public** so other modules can use them.             |
| `providers`    | Services this module contributes to the dependency injection system.   |
| `bootstrap`    | The root component to launch (root module only).                        |

> A component can be declared in **exactly one** module. To use it elsewhere,
> `export` it from its module and `import` that module where needed.

## Module structure in this project

```
src/app/
├── app.module.ts          # Root module — bootstraps the app
├── shared/
│   └── shared.module.ts    # Shared module — reusable UI (CardComponent)
└── tasks/
    └── tasks.module.ts     # Feature module — the Tasks feature
```

## Examples

### Root module — `app.module.ts`

Bootstraps `AppComponent` and pulls in feature/shared modules via `imports`.

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { UserComponent } from './user/user.component';
import { SharedModule } from './shared/shared.module';
import { TasksModule } from './tasks/tasks.module';

@NgModule({
  declarations: [AppComponent, HeaderComponent, UserComponent],
  bootstrap: [AppComponent],
  imports: [BrowserModule, FormsModule, SharedModule, TasksModule],
})
export class AppModule {}
```

### Feature module — `tasks/tasks.module.ts`

Owns the Tasks components and **exports** `TasksComponent` so the root module can use it.
Note it imports `CommonModule` (not `BrowserModule`) — feature modules use `CommonModule`.

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TasksComponent } from './tasks.component';
import { TaskComponent } from './task/task.component';
import { NewTaskComponent } from './new-task/new-task.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [TasksComponent, TaskComponent, NewTaskComponent],
  exports: [TasksComponent],
  imports: [CommonModule, FormsModule, SharedModule],
})
export class TasksModule {}
```

### Shared module — `shared/shared.module.ts`

Declares and exports reusable UI so any module can reuse `CardComponent`.

```ts
import { NgModule } from '@angular/core';

import { CardComponent } from './card/card.component';

@NgModule({
  declarations: [CardComponent],
  exports: [CardComponent],
})
export class SharedModule {}
```

## Key takeaways

- **`BrowserModule`** is imported **only** in the root module; feature modules use **`CommonModule`** for directives like `*ngIf` and `*ngFor`.
- A declaration lives in **one** module — `export` it to share it (see `CardComponent`, `TasksComponent`).
- A **shared module** centralizes reusable UI; a **feature module** isolates a feature's components.
- `FormsModule` must be imported in every module whose templates use `ngModel`.

## Running the project

```bash
ng serve        # dev server at http://localhost:4200/
ng build        # production build into dist/
ng test         # unit tests via Karma
```
