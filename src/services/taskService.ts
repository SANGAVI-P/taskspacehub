import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Task } from '../types/task';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
  /**
   * Fetches all tasks belonging to a specific authenticated user
   */
  async fetchTasksForUser(userId: string): Promise<Task[]> {
    try {
      if (!isFirebaseConfigured) {
        const storedTasks = localStorage.getItem('task-items');
        const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];
        return tasks.filter(t => t.creatorId === userId || t.assignee?.id === userId).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      }
      
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'initiated',
          priority: data.priority || 'medium',
          dueDate: data.dueDate || new Date().toISOString(),
          createdDate: data.createdAt || data.createdDate || new Date().toISOString(),
          tags: data.tags || [],
          subtasks: data.subtasks || [],
          assignee: data.assignee || undefined,
          taskUrl: data.taskUrl || undefined,
          progressPercent: data.progressPercent || 0,
          submission: data.submission || undefined,
        });
      });
      
      // Sort tasks in memory to prevent Firestore "require custom index" exception
      return tasks.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    } catch (error) {
      console.error('Error fetching tasks from Firestore:', error);
      throw error;
    }
  },

  /**
   * Fetches all tasks across all users in the system (for admin)
   */
  async fetchAllTasks(): Promise<Task[]> {
    try {
      if (!isFirebaseConfigured) {
        const storedTasks = localStorage.getItem('task-items');
        return storedTasks ? JSON.parse(storedTasks) : [];
      }

      const q = query(collection(db, TASKS_COLLECTION));
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'initiated',
          priority: data.priority || 'medium',
          dueDate: data.dueDate || new Date().toISOString(),
          createdDate: data.createdAt || data.createdDate || new Date().toISOString(),
          tags: data.tags || [],
          subtasks: data.subtasks || [],
          assignee: data.assignee || undefined,
          taskUrl: data.taskUrl || undefined,
          progressPercent: data.progressPercent || 0,
          submission: data.submission || undefined,
        });
      });
      
      return tasks.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    } catch (error) {
      console.error('Error fetching all tasks from Firestore:', error);
      throw error;
    }
  },

  /**
   * Fetches all registered users (for admin dashboard)
   */
  async fetchAllUsers(): Promise<any[]> {
    try {
      if (!isFirebaseConfigured) {
        const defaultUsers = [
          { uid: 'mock-admin-uid', name: 'Admin User', email: 'admin@test.com', role: 'admin', createdAt: '2026-06-01T12:00:00Z' },
          { uid: 'u1', name: 'Alex Rivera', email: 'alex.rivera@linear-style.com', role: 'user', createdAt: '2026-01-10T12:00:00Z' },
          { uid: 'u2', name: 'Emma Watson', email: 'emma.watson@test.com', role: 'user', createdAt: '2026-02-15T12:00:00Z' },
          { uid: 'u3', name: 'John Doe', email: 'john.doe@test.com', role: 'user', createdAt: '2026-03-20T12:00:00Z' }
        ];
        
        const sandboxUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
        const convertedSandbox = sandboxUsers.map((u: any) => ({
          uid: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
          createdAt: u.joinedDate || new Date().toISOString(),
        }));
        
        const merged = [...defaultUsers];
        convertedSandbox.forEach((su: any) => {
          if (!merged.some(mu => mu.email.toLowerCase() === su.email.toLowerCase())) {
            merged.push(su);
          }
        });
        return merged;
      }

      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const users: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          name: data.name || 'User',
          email: data.email || '',
          role: data.role || 'user',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching all users from Firestore:', error);
      throw error;
    }
  },

  /**
   * Adds a new team member to the workspace database
   */
  async addTeamMember(name: string, email: string, role: string): Promise<string> {
    try {
      if (!isFirebaseConfigured) {
        const sandboxUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
        const id = 'u-' + Math.random().toString(36).substring(2, 9);
        const mockProfile = {
          id,
          name,
          email,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          joinedDate: new Date().toISOString(),
          role: role || 'user',
        };
        sandboxUsers.push(mockProfile);
        localStorage.setItem('task-users-list', JSON.stringify(sandboxUsers));
        return id;
      }
      
      const docRef = await addDoc(collection(db, 'users'), {
        name,
        email,
        role: role || 'user',
        createdAt: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  },

  /**
   * Adds a new task to Firestore
   */
  async addTask(userId: string, taskData: Omit<Task, 'id' | 'createdDate'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        userId: userId,
        tags: taskData.tags,
        subtasks: taskData.subtasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: taskData.assignee || null,
        taskUrl: taskData.taskUrl || null,
        progressPercent: taskData.progressPercent || 0,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding task to Firestore:', error);
      throw error;
    }
  },

  /**
   * Patches an existing task document in Firestore
   */
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      
      const updatePayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      
      if (taskData.title !== undefined) updatePayload.title = taskData.title;
      if (taskData.description !== undefined) updatePayload.description = taskData.description;
      if (taskData.status !== undefined) updatePayload.status = taskData.status;
      if (taskData.priority !== undefined) updatePayload.priority = taskData.priority;
      if (taskData.dueDate !== undefined) updatePayload.dueDate = taskData.dueDate;
      if (taskData.tags !== undefined) updatePayload.tags = taskData.tags;
      if (taskData.subtasks !== undefined) updatePayload.subtasks = taskData.subtasks;
      if (taskData.assignee !== undefined) updatePayload.assignee = taskData.assignee;
      if (taskData.taskUrl !== undefined) updatePayload.taskUrl = taskData.taskUrl;
      if (taskData.submission !== undefined) updatePayload.submission = taskData.submission;
      if (taskData.progressPercent !== undefined) updatePayload.progressPercent = taskData.progressPercent;
      
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      console.error('Error updating task in Firestore:', error);
      throw error;
    }
  },

  /**
   * Deletes a task document from Firestore or Sandbox localStorage
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      if (isFirebaseConfigured) {
        const docRef = doc(db, TASKS_COLLECTION, taskId);
        await deleteDoc(docRef);
      } else {
        const storedTasks = localStorage.getItem('task-items');
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks) as Task[];
          const nextTasks = tasks.filter((t) => t.id !== taskId);
          localStorage.setItem('task-items', JSON.stringify(nextTasks));
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  /**
   * Finds a user in the database by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!isFirebaseConfigured) {
        const uList = await this.fetchAllUsers();
        const found = uList.find(u => u.email.toLowerCase() === trimmedEmail);
        return found || null;
      }
      
      const q = query(
        collection(db, 'users'),
        where('email', '==', trimmedEmail)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      let foundUser: any = null;
      querySnapshot.forEach((doc) => {
        foundUser = { uid: doc.id, ...doc.data() };
      });
      return foundUser;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  },

  /**
   * Adds an email to the invited list of a specific user workspace
   */
  async addInvitedEmail(userId: string, email: string): Promise<void> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (!isFirebaseConfigured) {
        const saved = localStorage.getItem(`task-invited-emails-${userId}`);
        const currentInvited: string[] = saved ? JSON.parse(saved) : [];
        if (!currentInvited.includes(trimmedEmail)) {
          currentInvited.push(trimmedEmail);
          localStorage.setItem(`task-invited-emails-${userId}`, JSON.stringify(currentInvited));
        }
        return;
      }
      
      // live firestore update
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const currentInvited: string[] = data.invitedEmails || [];
        if (!currentInvited.includes(trimmedEmail)) {
          await updateDoc(userDocRef, {
            invitedEmails: [...currentInvited, trimmedEmail]
          });
        }
      }
    } catch (error) {
      console.error('Error adding invited email:', error);
      throw error;
    }
  }
};

export default taskService;
