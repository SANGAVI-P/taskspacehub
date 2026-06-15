'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, ActivityLog, Notification } from '../types/task';
import { INITIAL_LOGS, INITIAL_NOTIFICATIONS, INITIAL_TASKS } from '../constants/dummyData';
import { useAuthContext } from './AuthContext';
import { taskService } from '../services/taskService';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Theme & Toasts
  toasts: ToastMessage[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  createTask: (task: Omit<Task, 'id' | 'createdDate'>) => Promise<void>;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Re-exported Auth fields
  user: any;
  loading: boolean;
  logout: () => void;
  
  // Logs & Notifications
  logs: ActivityLog[];
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Gamification
  userXP: number;
  streakCount: number;
  bestStreak: number;

  // Milestone Celebration
  showGiftBox: boolean;
  setShowGiftBox: (show: boolean) => void;
  activeMilestone: number | null;
  setActiveMilestone: (m: number | null) => void;
  showRewardModal: boolean;
  setShowRewardModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signOut } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [userXP, setUserXP] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);

  // Milestone celebration states
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Load theme preference and system logs
  useEffect(() => {
    try {
      // Clear old dummy sandbox tasks from localStorage to enforce clean slate
      const storedTasksCheck = localStorage.getItem('task-items');
      if (storedTasksCheck && storedTasksCheck.includes('Design Dashboard UI Mockups')) {
        localStorage.removeItem('task-items');
        localStorage.removeItem('task-logs');
        localStorage.removeItem('task-notifications');
      }

      const storedTheme = localStorage.getItem('task-theme') as 'light' | 'dark';
      const initialTheme = storedTheme || 'dark';
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Load XP, Streak, Notifications, and Logs on user change
  useEffect(() => {
    if (user) {
      const storedXP = localStorage.getItem(`task-xp-${user.id}`);
      const storedStreak = localStorage.getItem(`task-streak-${user.id}`);
      const storedBest = localStorage.getItem(`task-best-streak-${user.id}`);
      setUserXP(storedXP ? parseInt(storedXP) : 0);
      setStreakCount(storedStreak ? parseInt(storedStreak) : 0);
      setBestStreak(storedBest ? parseInt(storedBest) : 0);

      const storedNotifs = localStorage.getItem(`task-notifications-${user.id}`);
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      } else {
        setNotifications(INITIAL_NOTIFICATIONS);
        localStorage.setItem(`task-notifications-${user.id}`, JSON.stringify(INITIAL_NOTIFICATIONS));
      }

      const storedLogs = localStorage.getItem(`task-logs-${user.id}`);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        setLogs(INITIAL_LOGS);
        localStorage.setItem(`task-logs-${user.id}`, JSON.stringify(INITIAL_LOGS));
      }
    } else {
      setUserXP(0);
      setStreakCount(0);
      setBestStreak(0);
      setNotifications([]);
      setLogs([]);
    }
  }, [user]);



  // Helper to detect task expirations
  const checkAndSyncExpiredTasks = (items: Task[]): Task[] => {
    const now = new Date();
    
    const updated = items.map((task) => {
      if (
        task.status !== 'submitted' &&
        task.status !== 'completed' &&
        task.status !== 'expired' &&
        task.dueDate &&
        new Date(task.dueDate) < now
      ) {
        // Log activity log for expiration
        const newLog: ActivityLog = {
          id: 'l-' + Math.random().toString(36).substring(2, 9),
          taskId: task.id,
          taskTitle: task.title,
          action: `task expired: due date was ${new Date(task.dueDate).toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
          userName: 'System',
          type: 'update',
        };
        
        // Add log
        setTimeout(() => {
          setLogs((prev) => {
            const nextLogs = [newLog, ...prev];
            localStorage.setItem(`task-logs-${user.id}`, JSON.stringify(nextLogs));
            return nextLogs;
          });
        }, 0);

        const expiredTask: Task = { 
          ...task, 
          status: 'expired', 
          lastUpdatedDate: new Date().toISOString() 
        };
        
        if (user) {
          localStorage.setItem(`task-streak-${user.id}`, '0');
          setTimeout(() => {
            setStreakCount(0);
          }, 0);
        }
        
        // Persist update
        if (isFirebaseConfigured) {
          taskService.updateTask(task.id, { status: 'expired' });
        } else {
          setTimeout(() => {
            const allStored: Task[] = JSON.parse(localStorage.getItem('task-items') || '[]');
            const nextStored = allStored.map((t) => t.id === task.id ? expiredTask : t);
            localStorage.setItem('task-items', JSON.stringify(nextStored));
          }, 0);
        }
        
        return expiredTask;
      }
      return task;
    });

    return updated;
  };

  // Helper to send date notifications and check if already sent
  const checkDueNotifications = (items: Task[]) => {
    if (!user) return;
    const now = new Date();
    const todayStr = now.toDateString();
    
    setNotifications((prevNotifs) => {
      let updatedNotifs = [...prevNotifs];
      let hasNewNotifs = false;

      items.forEach((task) => {
        if (task.status === 'completed' || task.status === 'submitted') return;

        // Skip sending notifications if this task is assigned to someone else
        if (task.assignee && task.assignee.id !== user.id) return;

        const due = new Date(task.dueDate);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        const isDuplicate = (notifTitle: string) => {
          return updatedNotifs.some(n => n.title === notifTitle && n.description.includes(task.title));
        };

        const createNotif = (notifTitle: string, desc: string, notifType: 'task_due' | 'system') => {
          hasNewNotifs = true;
          const newNotif: Notification = {
            id: 'n-' + Math.random().toString(36).substring(2, 9),
            title: notifTitle,
            description: `Task "${task.title}": ${desc}`,
            timestamp: new Date().toISOString(),
            read: false,
            type: notifType,
          };
          updatedNotifs = [newNotif, ...updatedNotifs];
        };

        if (task.status === 'expired') {
          const title = 'Task Expired';
          if (!isDuplicate(title)) {
            createNotif(title, 'This task has passed its due date and is now Expired.', 'system');
          }
        } else if (due.toDateString() === todayStr) {
          const title = 'Due Today';
          if (!isDuplicate(title)) {
            createNotif(title, 'This task is due today! Make sure to submit on time.', 'task_due');
          }
        } else if (diffDays > 0 && diffDays <= 1) {
          const title = 'Due in 1 Day';
          if (!isDuplicate(title)) {
            createNotif(title, 'This task is due tomorrow.', 'task_due');
          }
        } else if (diffDays > 1 && diffDays <= 3) {
          const title = 'Due in 3 Days';
          if (!isDuplicate(title)) {
            createNotif(title, 'This task is due in 3 days.', 'task_due');
          }
        }
      });

      if (hasNewNotifs) {
        localStorage.setItem(`task-notifications-${user.id}`, JSON.stringify(updatedNotifs));
      }
      return updatedNotifs;
    });
  };

  // Fetch user tasks from Firestore when user changes
  useEffect(() => {
    const fetchTasksData = async () => {
      if (!user) {
        setTasks([]);
        return;
      }

      if (isFirebaseConfigured) {
        setTasksLoading(true);
        try {
          const items = await taskService.fetchTasksForUser(user.id);
          const checkedItems = checkAndSyncExpiredTasks(items);
          setTasks(checkedItems);
          checkDueNotifications(checkedItems);
        } catch (error) {
          showToast('Failed to sync tasks from Firestore', 'error');
        } finally {
          setTasksLoading(false);
        }
      } else {
        // Sandbox fallback: load from localStorage
        try {
          const storedTasks = localStorage.getItem('task-items');
          let allTasks: Task[] = [];
          if (storedTasks) {
            allTasks = JSON.parse(storedTasks);
          } else {
            allTasks = INITIAL_TASKS;
            localStorage.setItem('task-items', JSON.stringify(INITIAL_TASKS));
          }
          
          // Filter tasks so that only tasks created by or assigned to the active user are visible
          const filtered = allTasks.filter(t => t.creatorId === user.id || t.assignee?.id === user.id);
          const checkedItems = checkAndSyncExpiredTasks(filtered);
          setTasks(checkedItems);
          checkDueNotifications(checkedItems);
          
          // Show a sandbox banner notice on login mount
          showToast('Running in Demo Sandbox mode. Configure .env.local keys to sync Firestore.', 'info');
        } catch (error) {
          console.error(error);
        }
      }
    };
    
    fetchTasksData();
  }, [user]);

  // Theme Toggle
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('task-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast(`Switched to ${nextTheme} mode`, 'info');
  };

  // Toast Alerts
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Task CRUD sync
  const createTask = async (taskData: Omit<Task, 'id' | 'createdDate'>) => {
    if (!user) return;
    setTasksLoading(true);
    try {
      let docId = '';
      if (isFirebaseConfigured) {
        docId = await taskService.addTask(user.id, taskData);
      } else {
        docId = 't-' + Math.random().toString(36).substring(2, 9);
      }

      const newTask: Task = {
        ...taskData,
        id: docId,
        createdDate: new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
        creatorId: user.id,
        progressPercent: taskData.progressPercent !== undefined ? taskData.progressPercent : 0,
        status: taskData.status || 'initiated',
        assignee: taskData.assignee || user,
        assignedDate: taskData.assignee ? new Date().toISOString() : undefined,
      };
      
      const nextTasks = [newTask, ...tasks];
      if (!isFirebaseConfigured) {
        const allTasks: Task[] = JSON.parse(localStorage.getItem('task-items') || '[]');
        const nextAllTasks = [newTask, ...allTasks];
        localStorage.setItem('task-items', JSON.stringify(nextAllTasks));
        setTasks(nextAllTasks.filter((t: Task) => t.creatorId === user.id || t.assignee?.id === user.id));
      } else {
        setTasks(nextTasks);
      }

      // Notification if assigned to another user (send directly to their inbox)
      if (newTask.assignee && newTask.assignee.id !== user.id) {
        const newNotif: Notification = {
          id: 'n-' + Math.random().toString(36).substring(2, 9),
          title: 'Task Assigned',
          description: `You have been assigned a new task: "${newTask.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'task_assigned',
        };
        const assigneeKey = `task-notifications-${newTask.assignee.id}`;
        const assigneeStored = localStorage.getItem(assigneeKey) || '[]';
        let assigneeNotifs = [];
        try {
          assigneeNotifs = JSON.parse(assigneeStored);
        } catch (e) {
          assigneeNotifs = [];
        }
        localStorage.setItem(assigneeKey, JSON.stringify([newNotif, ...assigneeNotifs]));
      }

      // Log activity
      const newLog: ActivityLog = {
        id: 'l-' + Math.random().toString(36).substring(2, 9),
        taskId: docId,
        taskTitle: newTask.title,
        action: `Task Created`,
        timestamp: new Date().toISOString(),
        userName: user.name,
        type: 'create',
      };
      
      const logsToSave = [newLog];
      if (newTask.assignee) {
        logsToSave.push({
          id: 'l-' + Math.random().toString(36).substring(2, 9),
          taskId: docId,
          taskTitle: newTask.title,
          action: `Assigned to ${newTask.assignee.name}`,
          timestamp: new Date().toISOString(),
          userName: user.name,
          type: 'update',
        });
      }

      const updatedLogs = [...logsToSave, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem(`task-logs-${user.id}`, JSON.stringify(updatedLogs));

      // Copy log to assignee's activity logs
      if (newTask.assignee && newTask.assignee.id !== user.id) {
        const assigneeKey = `task-logs-${newTask.assignee.id}`;
        const assigneeStored = localStorage.getItem(assigneeKey) || '[]';
        let assigneeLogs = [];
        try {
          assigneeLogs = JSON.parse(assigneeStored);
        } catch (e) {
          assigneeLogs = [];
        }
        localStorage.setItem(assigneeKey, JSON.stringify([...logsToSave, ...assigneeLogs]));
      }

      showToast(isFirebaseConfigured ? 'Task saved to Firestore' : 'Task created in Sandbox', 'success');
    } catch (error) {
      showToast('Task creation failed', 'error');
    } finally {
      setTasksLoading(false);
    }
  };

  const updateTask = async (taskId: string, updatedTask: Partial<Task>) => {
    if (!user) return;
    setTasksLoading(true);
    try {
      const payload = {
        ...updatedTask,
        lastUpdatedDate: new Date().toISOString()
      };

      if (isFirebaseConfigured) {
        await taskService.updateTask(taskId, payload);
      }
      
      let oldTask: Task | undefined;
      const nextTasks = tasks.map((t) => {
        if (t.id === taskId) {
          oldTask = t;
          return { ...t, ...payload };
        }
        return t;
      });

      if (!isFirebaseConfigured) {
        const allTasks: Task[] = JSON.parse(localStorage.getItem('task-items') || '[]');
        const nextAllTasks = allTasks.map((t: Task) => t.id === taskId ? { ...t, ...payload } : t);
        localStorage.setItem('task-items', JSON.stringify(nextAllTasks));
        setTasks(nextAllTasks.filter((t: Task) => t.creatorId === user.id || t.assignee?.id === user.id));
      } else {
        setTasks(nextTasks);
      }

      // Log activity
      if (oldTask) {
        const logsToSave: ActivityLog[] = [];
        
        if (updatedTask.status && updatedTask.status !== oldTask.status) {
          let actionStr = `Status Changed to ${updatedTask.status.replace('-', ' ')}`;
          if (updatedTask.status === 'submitted') {
            actionStr = `Task Submitted`;
          } else if (updatedTask.status === 'completed' && oldTask.status !== 'completed') {
            actionStr = `Task Marked Completed`;
            
            // Trigger confetti for 1.5 to 2 seconds (1.8 seconds)
            if (typeof window !== 'undefined') {
              try {
                const duration = 1800; // 1.8 seconds
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(() => {
                  const timeLeft = animationEnd - Date.now();

                  if (timeLeft <= 0) {
                    return clearInterval(interval);
                  }

                  const particleCount = 30 * (timeLeft / duration);
                  
                  // Fire two symmetric side showers
                  confetti({ 
                    ...defaults, 
                    particleCount, 
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
                  });
                  confetti({ 
                    ...defaults, 
                    particleCount, 
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
                  });
                }, 200);
              } catch (e) {
                console.error("Failed to run confetti", e);
              }
            }
            
            // Award +10 XP for task completion
            const earnedXP = 10;
            setUserXP((prevXP) => {
              const newXP = prevXP + earnedXP;
              if (user) {
                localStorage.setItem(`task-xp-${user.id}`, newXP.toString());
                if (isFirebaseConfigured) {
                  const userDocRef = doc(db, 'users', user.id);
                  updateDoc(userDocRef, { xp: newXP }).catch(err => console.error(err));
                }
              }
              return newXP;
            });
            setTimeout(() => {
              showToast('Task Completed! +10 XP', 'success');
            }, 50);

            // Milestone completed tasks count check
            const nextCompletedCount = tasks.map(t => t.id === taskId ? { ...t, ...payload } : t).filter(t => t.status === 'completed').length;
            const milestones = [5, 10, 25];
            if (user) {
              const claimedStr = localStorage.getItem(`task-milestones-claimed-${user.id}`) || '[]';
              let claimed: number[] = [];
              try {
                claimed = JSON.parse(claimedStr);
              } catch (e) {
                claimed = [];
              }
              
              for (const m of milestones) {
                if (nextCompletedCount >= m && !claimed.includes(m)) {
                  claimed.push(m);
                  localStorage.setItem(`task-milestones-claimed-${user.id}`, JSON.stringify(claimed));
                  
                  // Trigger gift box popup
                  setActiveMilestone(m);
                  setShowGiftBox(true);
                  break;
                }
              }
            }

            const newNotif: Notification = {
              id: 'n-' + Math.random().toString(36).substring(2, 9),
              title: 'Task Completed',
              description: `Task "${oldTask.title}" has been reviewed and marked Completed.`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'system',
            };
            
            // Send notification to both creator and assignee
            const recipients = new Set<string>();
            if (oldTask.creatorId) recipients.add(oldTask.creatorId);
            if (oldTask.assignee?.id) recipients.add(oldTask.assignee.id);

            recipients.forEach((recipientId) => {
              const key = `task-notifications-${recipientId}`;
              const stored = localStorage.getItem(key) || '[]';
              let notifs = [];
              try {
                notifs = JSON.parse(stored);
              } catch (e) {
                notifs = [];
              }
              const updated = [newNotif, ...notifs];
              localStorage.setItem(key, JSON.stringify(updated));
              if (recipientId === user.id) {
                setNotifications(updated);
              }
            });
          } else if (updatedTask.status === 'expired') {
            actionStr = `Task Expired`;
            if (user) {
              localStorage.setItem(`task-streak-${user.id}`, '0');
              setStreakCount(0);
            }
          }
          
          logsToSave.push({
            id: 'l-' + Math.random().toString(36).substring(2, 9),
            taskId,
            taskTitle: oldTask.title,
            action: actionStr,
            timestamp: new Date().toISOString(),
            userName: user.name,
            type: 'update',
          });
        }
        
        if (updatedTask.assignee && (!oldTask.assignee || updatedTask.assignee.id !== oldTask.assignee.id)) {
          logsToSave.push({
            id: 'l-' + Math.random().toString(36).substring(2, 9),
            taskId,
            taskTitle: oldTask.title,
            action: `Assigned to ${updatedTask.assignee.name}`,
            timestamp: new Date().toISOString(),
            userName: user.name,
            type: 'update',
          });

          if (updatedTask.assignee.id !== user.id) {
            const newNotif: Notification = {
              id: 'n-' + Math.random().toString(36).substring(2, 9),
              title: 'Task Assigned',
              description: `You have been assigned to task: "${oldTask.title}"`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'task_assigned',
            };
            const assigneeId = updatedTask.assignee.id;
            const key = `task-notifications-${assigneeId}`;
            const stored = localStorage.getItem(key) || '[]';
            let notifs = [];
            try {
              notifs = JSON.parse(stored);
            } catch (e) {
              notifs = [];
            }
            const updated = [newNotif, ...notifs];
            localStorage.setItem(key, JSON.stringify(updated));
            if (assigneeId === user.id) {
              setNotifications(updated);
            }
          }
        }
        
        if (updatedTask.progressPercent !== undefined && updatedTask.progressPercent !== oldTask.progressPercent) {
          logsToSave.push({
            id: 'l-' + Math.random().toString(36).substring(2, 9),
            taskId,
            taskTitle: oldTask.title,
            action: `Progress Updated to ${updatedTask.progressPercent}%`,
            timestamp: new Date().toISOString(),
            userName: user.name,
            type: 'update',
          });
        }
        
        if (updatedTask.submission && !oldTask.submission) {
          logsToSave.push({
            id: 'l-' + Math.random().toString(36).substring(2, 9),
            taskId,
            taskTitle: oldTask.title,
            action: `Submission URL Added`,
            timestamp: new Date().toISOString(),
            userName: user.name,
            type: 'update',
          });
        }

        if (logsToSave.length > 0) {
          const updatedLogs = [...logsToSave, ...logs];
          setLogs(updatedLogs);
          localStorage.setItem(`task-logs-${user.id}`, JSON.stringify(updatedLogs));

          // Share log to assignee/creator if they are different from current user
          const partnerId = (updatedTask.assignee?.id || oldTask.assignee?.id) !== user.id 
            ? (updatedTask.assignee?.id || oldTask.assignee?.id)
            : (oldTask.creatorId !== user.id ? oldTask.creatorId : null);

          if (partnerId) {
            const partnerKey = `task-logs-${partnerId}`;
            const partnerStored = localStorage.getItem(partnerKey) || '[]';
            let partnerLogs = [];
            try {
              partnerLogs = JSON.parse(partnerStored);
            } catch (e) {
              partnerLogs = [];
            }
            localStorage.setItem(partnerKey, JSON.stringify([...logsToSave, ...partnerLogs]));
          }
        }
      }

      showToast(isFirebaseConfigured ? 'Task details modified' : 'Task details updated in Sandbox', 'success');
    } catch (error) {
      showToast('Task update failed', 'error');
    } finally {
      setTasksLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    setTasksLoading(true);
    try {
      if (isFirebaseConfigured) {
        await taskService.deleteTask(taskId);
      }
      
      if (!isFirebaseConfigured) {
        const allTasks: Task[] = JSON.parse(localStorage.getItem('task-items') || '[]');
        const nextAllTasks = allTasks.filter((t: Task) => t.id !== taskId);
        localStorage.setItem('task-items', JSON.stringify(nextAllTasks));
        setTasks(nextAllTasks.filter((t: Task) => t.creatorId === user.id || t.assignee?.id === user.id));
      } else {
        const nextTasks = tasks.filter((t) => t.id !== taskId);
        setTasks(nextTasks);
      }

      // Log activity
      const newLog: ActivityLog = {
        id: 'l-' + Math.random().toString(36).substring(2, 9),
        action: `deleted task: "${targetTask.title}"`,
        timestamp: new Date().toISOString(),
        userName: user.name,
        type: 'delete',
      };
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem(`task-logs-${user.id}`, JSON.stringify(updatedLogs));

      // Copy log to assignee if different from current user
      if (targetTask.assignee && targetTask.assignee.id !== user.id) {
        const assigneeKey = `task-logs-${targetTask.assignee.id}`;
        const assigneeStored = localStorage.getItem(assigneeKey) || '[]';
        let assigneeLogs = [];
        try {
          assigneeLogs = JSON.parse(assigneeStored);
        } catch (e) {
          assigneeLogs = [];
        }
        localStorage.setItem(assigneeKey, JSON.stringify([newLog, ...assigneeLogs]));
      }

      showToast(isFirebaseConfigured ? 'Task deleted from database' : 'Task removed from Sandbox', 'success');
    } catch (error) {
      showToast('Task delete failed', 'error');
    } finally {
      setTasksLoading(false);
    }
  };

  const markNotificationRead = (id: string) => {
    if (!user) return;
    const updatedNotifs = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifs);
    localStorage.setItem(`task-notifications-${user.id}`, JSON.stringify(updatedNotifs));
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifs);
    localStorage.setItem(`task-notifications-${user.id}`, JSON.stringify(updatedNotifs));
    showToast('All notifications marked as read', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        toasts,
        theme,
        toggleTheme,
        showToast,
        dismissToast,
        tasks,
        tasksLoading,
        createTask,
        updateTask,
        deleteTask,
        user,
        loading,
        logout: signOut,
        logs,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        userXP,
        streakCount,
        bestStreak,
        showGiftBox,
        setShowGiftBox,
        activeMilestone,
        setActiveMilestone,
        showRewardModal,
        setShowRewardModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
