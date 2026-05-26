export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'lead' | 'senior' | 'middle' | 'junior' | 'designer' | 'qa' | 'pm';

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  active: boolean;
  createdAt: string;
}

export type HistoryAction =
  | 'created'
  | 'status-changed'
  | 'priority-changed'
  | 'assignee-changed'
  | 'due-date-changed'
  | 'title-changed'
  | 'summary-changed'
  | 'team-changed'
  | 'reopened'
  | 'completed';

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  at: string;
  from?: string;
  to?: string;
  byUserId?: string | null;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  summary: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  teamId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  history: HistoryEntry[];
}

export interface NewTaskData {
  title: string;
  summary: string;
  dueDate: string;
  priority: TaskPriority;
  assigneeId: string | null;
  teamId: string | null;
  tags: string[];
}

export interface NewUserData {
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  teamId: string | null;
}

export interface NewTeamData {
  name: string;
  description: string;
  color: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  lead: 'Team Lead',
  senior: 'Senior',
  middle: 'Middle',
  junior: 'Junior',
  designer: 'Designer',
  qa: 'QA Engineer',
  pm: 'Project Manager',
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'In Review',
  'done': 'Done',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const AVATAR_OPTIONS: string[] = [
  'user-1.jpg',
  'user-2.jpg',
  'user-3.jpg',
  'user-4.jpg',
  'user-5.jpg',
  'user-6.jpg',
];

export const TEAM_COLORS: string[] = [
  '#9965dd',
  '#dd6592',
  '#65b8dd',
  '#74dd65',
  '#ddc265',
  '#dd8a65',
];
