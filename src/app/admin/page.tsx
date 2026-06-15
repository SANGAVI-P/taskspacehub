'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FolderKanban, 
  CheckCircle2, 
  BarChart3, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Tag, 
  Mail, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { taskService } from '../../services/taskService';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Loader } from '../../components/ui/Loader';
import { formatDate } from '../../lib/utils';
import { Task } from '../../types/task';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const { user, showToast } = useApp();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'tasks'>('stats');

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await taskService.fetchAllTasks();
      const fetchedUsers = await taskService.fetchAllUsers();
      setTasks(fetchedTasks);
      setUsers(fetchedUsers);
    } catch (error) {
      showToast('Failed to load administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (taskId: string, title: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskTitle(title);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTaskId) return;
    try {
      await taskService.deleteTask(selectedTaskId);
      showToast('Task deleted successfully from platform', 'success');
      setTasks(prev => prev.filter(t => t.id !== selectedTaskId));
    } catch (error) {
      showToast('Failed to delete task', 'error');
    } finally {
      setDeleteOpen(false);
      setSelectedTaskId(null);
    }
  };

  // Metrics calculations
  const totalTasks = tasks.length;
  const initiatedTasks = tasks.filter(t => t.status === 'initiated').length;
  const assignedTasks = tasks.filter(t => t.status === 'assigned').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const submissionPendingTasks = tasks.filter(t => t.status === 'submission-pending').length;
  const submittedTasks = tasks.filter(t => t.status === 'submitted').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const expiredTasks = tasks.filter(t => t.status === 'expired').length;
  const totalUsers = users.length;
  
  const completedRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader size="lg" className="mb-4" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
          Fetching system logs and metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white flex items-center gap-2">
          <ShieldCheck size={28} className="text-rose-500" /> Admin Control Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Systems Administrator Dashboard. Monitoring <span className="font-bold text-foreground">{totalUsers}</span> users and <span className="font-bold text-foreground">{totalTasks}</span> tasks platform-wide.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 pb-px">
        {(['stats', 'users', 'tasks'] as const).map((tab) => {
          const label = tab === 'stats' 
            ? 'Overview & Stats' 
            : tab === 'users' 
            ? `User Directory (${totalUsers})` 
            : `Global Tasks DB (${totalTasks})`;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none select-none ${
                activeTab === tab
                  ? 'text-rose-500 font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative z-10">{label}</span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeAdminTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Overview & Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Platform Users"
              value={totalUsers}
              icon={Users}
              iconColor="text-rose-500 dark:text-rose-400"
              bgColor="bg-rose-500/10"
              description="Active registered accounts"
            />
            <StatsCard
              title="Total Platform Tasks"
              value={totalTasks}
              icon={FolderKanban}
              iconColor="text-indigo-500 dark:text-indigo-400"
              bgColor="bg-indigo-500/10"
              description={`${completedRate}% completion rate`}
            />
            <StatsCard
              title="Pending Review"
              value={submittedTasks}
              icon={BarChart3}
              iconColor="text-amber-500 dark:text-amber-400"
              bgColor="bg-amber-500/10"
              description="Awaiting verification"
            />
            <StatsCard
              title="Completed Tasks"
              value={completedTasks}
              icon={CheckCircle2}
              iconColor="text-emerald-500 dark:text-emerald-400"
              bgColor="bg-emerald-500/10"
              description={`${inProgressTasks} in progress, ${expiredTasks} expired`}
            />
          </div>

          {/* Detailed statistics tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">
                Task Status Breakdown
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-zinc-400" />
                    <span>Initiated</span>
                  </div>
                  <span className="font-bold">{initiatedTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-400" />
                    <span>Assigned</span>
                  </div>
                  <span className="font-bold">{assignedTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-indigo-400" />
                    <span>In Progress</span>
                  </div>
                  <span className="font-bold">{inProgressTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-400" />
                    <span>Submission Pending</span>
                  </div>
                  <span className="font-bold">{submissionPendingTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span>Submitted</span>
                  </div>
                  <span className="font-bold">{submittedTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span>Completed</span>
                  </div>
                  <span className="font-bold">{completedTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span>Expired</span>
                  </div>
                  <span className="font-bold">{expiredTasks}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">
                System Metrics
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span>Task-to-User Ratio</span>
                  <span className="font-bold">{(totalTasks / (totalUsers || 1)).toFixed(1.5)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span>Database Mode</span>
                  <span className="font-semibold text-primary">Local Storage Sandbox</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/40">
                  <span>System Authority</span>
                  <span className="font-bold text-rose-500">Full Access</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Authorization Engine</span>
                  <span className="font-semibold text-emerald-400">RBAC Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Directory Tab */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="h-8 w-8 rounded-full border border-border"
                        />
                        <span className="text-sm font-semibold text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} /> {u.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={u.role === 'admin' ? 'high' : 'in-progress'} className="uppercase text-[9px] font-black tracking-wider">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {formatDate(u.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Tasks DB Tab */}
      {activeTab === 'tasks' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No tasks found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Task</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {task.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 text-[8px] font-bold tracking-wide bg-secondary border border-border text-muted-foreground rounded uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              className="h-6 w-6 rounded-full border border-border"
                            />
                            <span className="font-semibold text-foreground">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="italic text-muted-foreground/60">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={task.status}>{task.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={task.priority}>{task.priority}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} /> {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button
                          onClick={() => handleDeleteClick(task.id, task.title)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete task platform-wide"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Administrative Task Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 items-start text-sm">
            <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-muted-foreground leading-relaxed">
              Are you sure you want to delete the task <span className="font-bold text-foreground">"{selectedTaskTitle}"</span>? This will permanently delete this record from the database. This action is irreversible.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
