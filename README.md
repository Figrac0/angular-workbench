<div align="center">

# EasyTask

### A full-featured team task management panel built on Angular 18

*Plan, assign, and ship work across your team — without the friction of a real ticketing system.*

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Signals](https://img.shields.io/badge/Reactivity-Signals-9965dd)](https://angular.dev/guide/signals)
[![Standalone](https://img.shields.io/badge/Components-Standalone-65b8dd)](https://angular.dev/guide/standalone-components)

</div>

---

<div align="center">
  <a href="https://angular-workbench-v1.vercel.app/" target="_blank">
    <img
      src="https://github.com/Figrac0/Figrac0/blob/main/href.svg"
      alt="Quick Access - Visit Site"
      width="50%"
    />
  </a>
</div>

---

## Overview

EasyTask started as a tiny Angular learning demo (one user list, one task list) and grew into a thought-out internal task panel. It covers the full loop that a small product team actually needs day-to-day:

- A **dashboard** that summarises throughput, deadlines, and per-team load
- A **board / list** view for tasks with statuses, priorities, filters, search and per-card history
- **CRUD for members** — add, edit, deactivate, reassign across teams
- **CRUD for teams** with members, accent colors, and team-wide tasks
- A **history log** on every task so changes are auditable, not invisible
- **Persistence** to `localStorage` — refresh the page and your state survives

Everything is built with **Angular 18 standalone components and signals**, no NgModules, no third-party state library, no backend required.

---

## Key features

| Area | What it does |
| --- | --- |
| **Dashboard** | Live KPIs (Total · In Progress · Review · Done · Overdue), upcoming deadlines, per-team load with progress bars, recently completed tasks |
| **Tasks** | Kanban board + List view, four-state workflow (`todo → in-progress → review → done`), four-level priority, tags, due dates, overdue highlighting, quick status advance, search across title/summary/tags, filters by assignee/team/priority |
| **Members** | Add / edit / deactivate / remove employees, role taxonomy (Lead, Senior, Middle, Junior, Designer, QA, PM), avatar picker, side profile panel with the member's open tasks |
| **Teams** | Create teams with name / description / accent color, see member roster as stacked avatars, see open and overdue task counts per team |
| **Task detail** | Full task view with one-click status switching, priority change, and a complete chronological **history timeline** of every change |
| **History** | Every status change, reassignment, priority bump, due-date shift, edit, completion and reopen is recorded with timestamps |
| **UX polish** | Animated header (floating logo, aurora orbs, shimmer text), custom scrollbars, themed dropdowns, glassy modals, prefers-reduced-motion respect |
| **Mobile** | Adaptive layouts for tablet and phone; nothing overflows on narrow screens |

---

## Tech stack

- **Angular 18** with the new control-flow syntax (`@if`, `@for`, `@switch`)
- **Standalone components** — every component opts in to its own dependencies via `imports`
- **Signals** for fine-grained, glitch-free reactivity (`signal`, `computed`)
- **TypeScript 5.4** with strict typing across models, services and components
- **CSS** — handwritten, no framework. Component-scoped styles plus a small global layer for scrollbars, selects, and date inputs.
- **localStorage** as the persistence layer (synchronous, no backend)

### How Angular makes this small

Two ideas from Angular do most of the heavy lifting in this codebase.

#### 1. Directives — the way HTML gets behavior

Standalone components, attribute bindings (`[class.active]`), event listeners (`(click)`), and structural blocks (`@if`, `@for`) are all powered by directives under the hood. They are how plain HTML gains application behavior without us writing manual DOM code.

![Angular Directives and Element Enhancement](src/assets/ForGit/Angular%20Directives%20and%20Element%20Enhancement.png)

In EasyTask this shows up as:

- `[class.active]="view() === tab.key"` on the nav tabs — a directive that toggles a class from a signal value
- `@for (task of filtered(); track task.id)` in the board — a structural block iterating a computed signal
- `<app-modal [title]="...">` — a component (a directive with a template) wrapping arbitrary content via `<ng-content />`

#### 2. Signals — the reactivity model

There is no NgRx, no RxJS subjects, no `ChangeDetectorRef`. Every piece of state in the app — tasks, members, teams, filters, the currently-open modal — lives in a `signal`. Anything *derived* from that state is a `computed`. When you call `.set()` or `.update()` on a signal, Angular knows exactly which views need to re-render and updates only those.

![Angular Signal Value Flow and UI Update Mechanism](src/assets/ForGit/Angular%20Signal%20Value%20Flow%20and%20UI%20Update%20Mechanism.png)

Concretely, in [tasks.service.ts](src/app/services/tasks.service.ts):

```ts
private readonly _tasks = signal<Task[]>(this.load());

readonly tasks = computed(() => this._tasks());

readonly stats = computed(() => {
  const list = this._tasks();
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: list.length,
    inProgress: list.filter((t) => t.status === 'in-progress').length,
    overdue: list.filter((t) => t.status !== 'done' && t.dueDate < today).length,
    /* … */
  };
});
```

When `setStatus()` updates a task, the dashboard's KPI cards, the board column counts, the navigation badges, and the team-load progress bars all update in the same tick — without a single subscription, observable, or change-detection hint.

---

## Project structure

```
src/
├── app/
│   ├── app.component.{ts,html,css}      # Root shell + view-switcher nav
│   ├── models.ts                        # All types (User, Team, Task, History, …)
│   ├── header/                          # Animated brand header
│   ├── data/
│   │   └── seed-data.ts                 # Initial teams / users / tasks
│   ├── services/
│   │   ├── tasks.service.ts             # Tasks CRUD + status / priority / history
│   │   ├── users.service.ts             # Members CRUD
│   │   └── teams.service.ts             # Teams CRUD
│   ├── shared/
│   │   ├── card/                        # Surface primitive
│   │   ├── badge/                       # Status / priority / tag chips
│   │   ├── modal/                       # Flex-centered modal with custom scrollbar
│   │   └── confirm/                     # Destructive-action confirmation
│   ├── components/
│   │   ├── task-form/                   # Create + edit task (one component)
│   │   ├── user-form/                   # Create + edit member, avatar picker
│   │   ├── team-form/                   # Create + edit team, color swatches
│   │   └── task-detail/                 # Read + status switcher + history timeline
│   └── features/
│       ├── dashboard/                   # Stats, upcoming, team load, recently done
│       ├── board/                       # Kanban + list view, filters, search
│       ├── members/                     # Members grid + profile sidebar
│       └── teams/                       # Teams grid with rosters
├── assets/
│   ├── users/                           # Avatar images
│   ├── ForGit/                          # Diagrams used in this README
│   ├── favicon.ico
│   └── task-management-logo.png
├── index.html
├── main.ts
└── styles.css                           # Global: scrollbar, select, date input
```

---

## Getting started

### Prerequisites
- **Node.js 18+** and **npm 9+**

### Install and run

```bash
npm install
npm start              # ng serve at http://localhost:4200
```

The app starts with a small seed of teams, members and tasks. Everything you do from there is persisted in `localStorage` under the keys `easytask.tasks`, `easytask.users`, `easytask.teams`.

### Build for production

```bash
npm run build          # output in dist/essentials
```

### Reset demo data

Open DevTools → Application → Local Storage → your origin → delete the three `easytask.*` keys → reload.

---

## A note on data shape

The data model is intentionally explicit and self-describing. From [models.ts](src/app/models.ts):

```ts
interface Task {
  id: string;
  title: string;
  summary: string;
  dueDate: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string | null;
  teamId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  history: HistoryEntry[];
}
```

A task can be assigned to a **person**, a **team**, or both. Deleting a team unsets `teamId` on its members and tasks; deleting a member unassigns their open tasks. Nothing dangles.

---

## Design language

- **Palette** — deep violet (`#0b0519` → `#3a2c54`) with a primary accent of `#9965dd`, supported by status colors for in-progress (blue), review (yellow), done (green), and overdue/urgent (red/pink).
- **Type** — Poppins from Google Fonts.
- **Surfaces** — soft gradients (`#3a2c54 → #2c1f44`), thin border in `rgba(195, 179, 216, 0.1)`, generous shadows for elevation.
- **Motion** — short cubic-bezier transitions for hover, gentle floats and shimmer on the header. All animations honour `prefers-reduced-motion`.

---

## Roadmap ideas

- Drag-and-drop status changes on the board
- Comments / discussion thread per task
- Filters saved as named "views"
- Export to CSV / JSON
- Optional REST backend (the services are already a clean seam)
- Light theme toggle

---

## License

MIT — free to fork, learn from, and build on.
