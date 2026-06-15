import { Task, User, ActivityLog, Notification } from '../types/task';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  email: 'alex.rivera@linear-style.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  joinedDate: '2026-01-10T12:00:00Z',
  role: 'user',
};

// Start with clean slate empty arrays
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_LOGS: ActivityLog[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];
