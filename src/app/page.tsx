'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  ListTodo, 
  Hourglass, 
  RotateCw, 
  CheckCircle, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  FolderPlus,
  UserPlus,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { formatDate, cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { taskService } from '../services/taskService';
import { motion } from 'framer-motion';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();
  const { 
    tasks, 
    logs, 
    user, 
    tasksLoading, 
    updateTask,
    showToast
  } = useApp();

  // Local Modal States for Quick Actions
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  // Project creation form inputs
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projUrl, setProjUrl] = useState('');

  // Team Invite inputs
  const [inviteEmail, setInviteEmail] = useState('');

  const [memberCount, setMemberCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  // Load quick notes and fetch workspace metrics
  useEffect(() => {
    const savedNote = localStorage.getItem('task-quick-note');
    if (savedNote) setQuickNote(savedNote);

    const loadMetrics = async () => {
      if (!user) return;
      try {
        let invitedEmails: string[] = [];
        if (!isFirebaseConfigured) {
          const saved = localStorage.getItem(`task-invited-emails-${user.id}`);
          invitedEmails = saved ? JSON.parse(saved) : [];
        } else {
          const userDocRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userDocRef);
          invitedEmails = userDoc.exists() ? (userDoc.data().invitedEmails || []) : [];
        }

        const uList = await taskService.fetchAllUsers();
        const filteredUsers = uList.filter(u => {
          const uEmail = (u.email || '').toLowerCase();
          const uUid = u.uid || u.id;
          const isCurrentUser = uUid === user.id || uEmail === user.email?.toLowerCase();
          return isCurrentUser || invitedEmails.includes(uEmail);
        });
        setMemberCount(filteredUsers.length);
      } catch (e) {
        console.error(e);
        setMemberCount(1);
      }
    };
    loadMetrics();

    const savedProjs = localStorage.getItem('task-projects');
    if (savedProjs) {
      try {
        const parsed = JSON.parse(savedProjs);
        setProjectCount(parsed.length);
      } catch (e) {
        setProjectCount(0);
      }
    }
  }, [tasks, user]);

  const handleSaveNote = () => {
    localStorage.setItem('task-quick-note', quickNote);
    showToast('Quick Note saved locally!', 'success');
    setIsNoteOpen(false);
  };

  const handleCreateProject = () => {
    if (!projName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    
    // Save project in localStorage
    if (typeof window !== 'undefined') {
      const savedProjs = localStorage.getItem('task-projects');
      let currentProjs = [];
      if (savedProjs) {
        try {
          currentProjs = JSON.parse(savedProjs);
        } catch (e) {
          currentProjs = [];
        }
      }
      const newProj = {
        id: 'p' + (currentProjs.length + 1),
        name: projName,
        description: projDesc || 'No description provided.',
        progress: 0,
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teamSize: 1,
        tasksCount: 0,
        category: 'General Workspace',
        projectUrl: projUrl.trim() || undefined,
      };
      const updatedProjs = [newProj, ...currentProjs];
      localStorage.setItem('task-projects', JSON.stringify(updatedProjs));
    }

    showToast(`Project "${projName}" created successfully!`, 'success');
    setProjName('');
    setProjDesc('');
    setProjUrl('');
    setIsProjectModalOpen(false);
    window.location.reload();
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      showToast('Email address is required', 'error');
      return;
    }

    try {
      // 1. Verify email registration in database users collection
      const registeredUser = await taskService.getUserByEmail(inviteEmail);
      if (!registeredUser) {
        showToast('User not found. Ask them to create an account first.', 'error');
        return;
      }

      // 2. Persist invite connection in database
      if (user) {
        await taskService.addInvitedEmail(user.id, inviteEmail);
      }

      showToast('Member added successfully.', 'success');
      setInviteEmail('');
      setIsInviteModalOpen(false);
      
      // Refresh user list count
      let invitedEmails: string[] = [];
      if (!isFirebaseConfigured) {
        const saved = localStorage.getItem(`task-invited-emails-${user?.id}`);
        invitedEmails = saved ? JSON.parse(saved) : [];
      } else if (user) {
        const userDocRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userDocRef);
        invitedEmails = userDoc.exists() ? (userDoc.data().invitedEmails || []) : [];
      }
      const uList = await taskService.fetchAllUsers();
      const filteredCount = uList.filter(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uUid = u.uid || u.id;
        const isCurrentUser = user && (uUid === user.id || uEmail === user.email?.toLowerCase());
        return isCurrentUser || invitedEmails.includes(uEmail);
      }).length;
      setMemberCount(filteredCount);
    } catch (e) {
      showToast('Failed to invite team member', 'error');
    }
  };

  // Quotes generator
  const quotes = [
    "Focus on being productive instead of busy.",
    "Small daily improvements over time lead to stunning results.",
    "The secret of getting ahead is getting started.",
    "Make today count! Action is the foundational key to all success.",
    "Your potential is unlimited. Let's conquer today's goals!"
  ];
  const [greetingQuote, setGreetingQuote] = useState('');
  useEffect(() => {
    setGreetingQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);



  // Metrics Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => t.status === 'expired').length;
  const completedRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const tasksDueToday = tasks.filter(t => t.dueDate?.split('T')[0] === todayStr && t.status !== 'completed' && t.status !== 'expired').length;

  // Today's Tasks Tabs Filter
  const [tasksTab, setTasksTab] = useState<'today' | 'soon' | 'completed'>('today');

  const getFilteredTasks = () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 3);
    const soonStr = soonDate.toISOString().split('T')[0];

    if (tasksTab === 'completed') {
      return tasks.filter(t => t.status === 'completed');
    }
    if (tasksTab === 'soon') {
      return tasks.filter(t => {
        const dueStr = t.dueDate?.split('T')[0];
        return t.status !== 'completed' && t.status !== 'expired' && dueStr > todayStr && dueStr <= soonStr;
      });
    }
    // Today's active tasks
    return tasks.filter(t => t.dueDate?.split('T')[0] === todayStr && t.status !== 'completed' && t.status !== 'expired');
  };

  const currentTabTasks = getFilteredTasks();

  const handleQuickCompleteTask = (taskId: string) => {
    updateTask(taskId, { status: 'completed', progressPercent: 100 });
  };

  // Recharts Weekly Data extraction
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const dataMap = days.reduce((acc, day) => {
      acc[day] = { day, completed: 0, created: 0 };
      return acc;
    }, {} as Record<string, { day: string; completed: number; created: number }>);

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    tasks.forEach((task) => {
      if (!task.createdDate) return;
      const created = new Date(task.createdDate);
      if (created >= monday && created <= sunday) {
        const dayIndex = (created.getDay() + 6) % 7;
        const dayName = days[dayIndex];
        if (dataMap[dayName]) dataMap[dayName].created += 1;
      }
    });

    logs.forEach((log) => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      if (logDate >= monday && logDate <= sunday) {
        const isCompletion = 
          log.type === 'update' && 
          (log.action.includes('Completed') || log.action.includes('status to completed'));
        
        if (isCompletion) {
          const dayIndex = (logDate.getDay() + 6) % 7;
          const dayName = days[dayIndex];
          if (dataMap[dayName]) {
            dataMap[dayName].completed += 1;
          }
        }
      }
    });

    return Object.values(dataMap);
  };

  const weeklyChartData = getWeeklyData();

  // Upcoming Deadlines List (top 4 active tasks sorted by due date)
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'expired')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Stagger Animations variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring' as const, damping: 20, stiffness: 200 } 
    }
  };

  return (
    <div className="space-y-8 max-w-7xl w-full mx-auto select-none pb-12">
      
      {/* SECTION 1 — HERO AREA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-[#EEF2FF] to-[#E0F2FE] dark:from-[#151B2E] dark:to-[#151B2E] border border-indigo-100/85 dark:border-border p-6 md:p-8 rounded-2xl relative overflow-hidden group shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="space-y-2.5 max-w-2xl">
          <span className="text-xs font-bold text-[#7C5CFF] tracking-wider uppercase bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 px-2.5 py-1 rounded-full">
            Workspace Active
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#111827] dark:text-white truncate max-w-full">
            {user?.name ? `Welcome back, ${user.name.trim().split(' ')[0]}` : 'Welcome back'} 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Ready to conquer today's goals?
          </p>
          <p className="text-xs text-muted-foreground italic leading-relaxed pt-1.5 flex items-center gap-1.5">
            <BookOpen size={13} className="text-[#7C5CFF]" /> "{greetingQuote}"
          </p>
        </div>

        {/* Hero Quick Stats */}
        <div className="grid grid-cols-2 gap-4 shrink-0 border-t md:border-t-0 md:border-l border-indigo-200/50 dark:border-border pt-6 md:pt-0 md:pl-8">
          <div className="text-center px-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Due Today</span>
            <span className="text-xl font-black text-[#111827] dark:text-white block mt-1">
              {tasksDueToday} Tasks
            </span>
          </div>

          <div className="text-center px-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Completion Rate</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
              {completedRate}%
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — QUICK ACTIONS */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <button 
            onClick={() => router.push('/tasks/create')}
            className="p-4 bg-card border border-border hover:border-[#7C5CFF]/45 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group shadow-sm text-foreground"
          >
            <Plus size={20} className="text-[#7C5CFF] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Create Task</span>
          </button>

          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="p-4 bg-card border border-border hover:border-[#7C5CFF]/45 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group shadow-sm text-foreground"
          >
            <FolderPlus size={20} className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Create Project</span>
          </button>

          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="p-4 bg-card border border-border hover:border-[#7C5CFF]/45 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group shadow-sm text-foreground"
          >
            <UserPlus size={20} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Invite Member</span>
          </button>

          <button 
            onClick={() => setIsNoteOpen(true)}
            className="p-4 bg-card border border-border hover:border-[#7C5CFF]/45 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group shadow-sm text-foreground"
          >
            <BookOpen size={20} className="text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold">Quick Note</span>
          </button>

        </div>
      </div>

      {/* SECTION 3 — METRICS STATS ROW */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={staggerItem} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#7C5CFF]/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks Due Today</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-foreground">{tasksDueToday}</span>
            <span className="text-[10px] text-muted-foreground block mt-1 font-bold uppercase tracking-wider">
              Urgent deliverables
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#7C5CFF]/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Tasks</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-foreground">{overdueTasks}</span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-1 font-bold uppercase tracking-wider">
              Requires immediate action
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#7C5CFF]/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</span>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <CheckSquare size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-foreground">{projectCount}</span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-1 font-bold uppercase tracking-wider">
              Roadmap project scopes
            </span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#7C5CFF]/20 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team Members</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-foreground">{memberCount}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-bold uppercase tracking-wider">
              Registered collaborators
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* SECTION 5 — WORKSPACE ROADMAP */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-md min-h-[350px] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckSquare size={16} className="text-[#7C5CFF]" /> Workspace Tasks
            </h3>
            
            {/* Task Tabs */}
            <div className="flex bg-secondary p-0.5 rounded-lg border border-border gap-1 self-start">
              {(['today', 'soon', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTasksTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all focus:outline-none",
                    tasksTab === tab 
                      ? "bg-card text-[#7C5CFF] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === 'today' ? "Today's Tasks" : tab === 'soon' ? "Due Soon" : "Completed Tasks"}
                </button>
              ))}
            </div>
          </div>

          {/* Task list container */}
          {tasksLoading ? (
            <div className="space-y-3.5 animate-pulse py-2">
              <div className="h-16 bg-secondary/80 rounded-xl" />
              <div className="h-16 bg-secondary/80 rounded-xl" />
            </div>
          ) : currentTabTasks.length === 0 ? (
            
            /* EMPTY STATES */
            <div className="flex flex-col items-center text-center py-10 px-4">
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
                <ClipboardList size={28} />
              </div>
              
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
                  No tasks found
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tasksTab === 'today' 
                    ? "No tasks are due today. Take a moment to prepare for upcoming deadlines!" 
                    : tasksTab === 'soon' 
                      ? "No tasks are due in the next 3 days. Excellent job keeping ahead!" 
                      : "No completed tasks to display yet. Complete active items to see them here!"}
                </p>
                {tasksTab === 'today' && (
                  <Button onClick={() => router.push('/tasks/create')} size="sm" className="mt-4 text-xs bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
                    + Add Task
                  </Button>
                )}
              </div>
            </div>

          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {currentTabTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-3.5 bg-secondary/35 border border-border/60 hover:border-[#7C5CFF]/30 rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Checkbox selector to complete */}
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleQuickCompleteTask(task.id)}
                        className="h-5 w-5 rounded border border-border hover:border-[#7C5CFF]/50 hover:bg-[#7C5CFF]/5 flex items-center justify-center shrink-0 cursor-pointer focus:outline-none"
                        title="Mark completed"
                      >
                        <CheckCircle2 size={13} className="text-transparent hover:text-[#7C5CFF]/45 transition-colors" />
                      </button>
                    )}

                    {task.status === 'completed' && (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle size={14} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <Link href={`/tasks/${task.id}`}>
                        <span className={cn(
                          "text-sm font-bold text-foreground hover:text-[#7C5CFF] transition-colors cursor-pointer block truncate",
                          task.status === 'completed' && "line-through text-slate-400 dark:text-slate-500"
                        )}>
                          {task.title}
                        </span>
                      </Link>
                      
                      <div className="flex items-center flex-wrap gap-2 mt-1.5">
                        <Badge variant={task.priority} className="text-[9px] uppercase px-1.5 py-px">
                          {task.priority}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <Calendar size={11} className="mr-1 text-slate-400" />
                          Due {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/tasks/${task.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs shrink-0 select-none text-muted-foreground hover:text-foreground hover:bg-secondary">
                      Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-border pt-3.5 mt-4 flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>Overall Workspace Completion rate:</span>
          <span className="font-extrabold text-foreground">{completedRate}%</span>
        </div>
      </div>

      {/* SECTION 6 — ANALYTICS AND DEADLINES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Weekly Productivity Chart */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-[#7C5CFF]" /> Weekly Productivity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Summary of task completion frequency for the current week</p>
            </div>
            <Link href="/analytics" className="text-xs font-semibold text-[#7C5CFF] hover:underline flex items-center gap-1">
              View Analytics <ArrowRight size={13} />
            </Link>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletedDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--foreground)' }} />
                <Area name="Completed Tasks" type="monotone" dataKey="completed" stroke="#7C5CFF" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCompletedDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines List */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 border-b border-border pb-4">
              <Clock size={16} className="text-amber-600 dark:text-amber-400" /> Upcoming Deadlines
            </h3>

            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No upcoming deadlines.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <Link href={`/tasks/${task.id}`}>
                        <span className="font-semibold text-foreground hover:text-[#7C5CFF] block truncate cursor-pointer">
                          {task.title}
                        </span>
                      </Link>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    <Badge variant={task.priority} className="text-[9px] uppercase px-1.5 py-px shrink-0">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Link href="/tasks" className="text-xs font-semibold text-[#7C5CFF] hover:underline flex items-center justify-end mt-4">
            View All Tasks <ChevronRight size={13} />
          </Link>
        </div>

      </div>

      {/* SECTION 8 — RECENT ACTIVITY */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
          <Activity size={16} className="text-[#7C5CFF] animate-pulse" /> Recent Activity Log
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No activity logged yet.
          </div>
        ) : (
          <div className="relative border-l border-border pl-4 space-y-4 max-h-[250px] overflow-y-auto">
            {logs.slice(0, 5).map((log, idx) => {
              let logIcon = AlertTriangle;
              let colorClass = 'text-[#7C5CFF] bg-[#7C5CFF]/10';
              
              if (log.action.includes('Marked Completed') || log.action.includes('Completed')) {
                logIcon = CheckCircle2;
                colorClass = 'text-emerald-500 bg-emerald-500/10';
              } else if (log.action.includes('Created')) {
                logIcon = Plus;
                colorClass = 'text-indigo-400 bg-indigo-500/10';
              } else if (log.action.includes('deleted')) {
                logIcon = AlertTriangle;
                colorClass = 'text-rose-500 bg-rose-500/10';
              }

              return (
                <div key={log.id || idx} className="relative text-xs leading-normal">
                  <span className="absolute -left-[22.5px] top-1 h-3.5 w-3.5 rounded-full bg-card border-2 border-border flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF]" />
                  </span>

                  <div>
                    <p className="text-muted-foreground font-semibold">
                      <span className="font-extrabold text-[#7C5CFF]">{log.userName}</span>{' '}
                      <span className="text-foreground">{log.action}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK NOTE DRAWER DIALOG */}
      <Modal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        title="Interactive Quick Note Pad"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-normal">
            Jot down thoughts, temporary checklist subtasks, or scratch reminders. Notes persist on this browser.
          </p>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Type notes here..."
            className="w-full min-h-[160px] p-3.5 bg-secondary border border-border text-sm text-foreground rounded-lg transition-all focus:outline-none focus:border-primary placeholder:text-muted-foreground/60"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsNoteOpen(false)} className="border-border text-foreground">
              Close
            </Button>
            <Button size="sm" onClick={handleSaveNote} className="bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
              Save Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE PROJECT DIALOG */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Create Workspace Project"
        size="md"
      >
        <div className="space-y-4">
          <Input 
            label="Project Title"
            placeholder="e.g. Notion API Sync"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            autoFocus
          />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Description</label>
            <textarea 
              placeholder="Scope details..."
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              className="w-full min-h-[80px] p-3 bg-secondary border border-border text-sm text-foreground rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <Input 
            label="Project URL / Reference (Image or Link)"
            placeholder="https://example.com/project-spec.pdf or screenshot.png"
            value={projUrl}
            onChange={(e) => setProjUrl(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsProjectModalOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateProject} className="bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* TEAM MEMBER INVITATION DIALOG */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Workspace Member"
        size="md"
      >
        <div className="space-y-4">
          <Input 
            label="Email Address"
            placeholder="elena@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button size="sm" onClick={handleInviteUser} className="bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
