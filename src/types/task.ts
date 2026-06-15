export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'initiated' | 'assigned' | 'in-progress' | 'submission-pending' | 'submitted' | 'completed' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; // URL or letter placeholder
  joinedDate: string;
  role: 'admin' | 'user';
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Submission {
  submissionUrl?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  driveLink?: string;
  notes?: string;
  attachmentName?: string;
  submittedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  createdDate: string;
  subtasks: SubTask[];
  tags: string[];
  assignee?: User;
  assignedDate?: string;
  progressPercent?: number;
  lastUpdatedDate?: string;
  creatorId?: string;
  submission?: Submission;
  taskUrl?: string;
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  taskTitle?: string;
  action: string; // e.g., 'created', 'updated status to completed', etc.
  timestamp: string;
  userName: string;
  type: 'create' | 'update' | 'delete' | 'comment' | 'auth';
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'task_due' | 'task_assigned' | 'system';
}
