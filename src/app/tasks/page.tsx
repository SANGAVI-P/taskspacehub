'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FolderKanban, Plus, Search, Filter, SortAsc, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Priority, TaskStatus, Task } from '../../types/task';
import { TaskCardSkeleton } from '../../components/ui/Loader';
import { motion } from 'framer-motion';

import { taskService } from '../../services/taskService';
import { cn } from '../../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as const, damping: 20, stiffness: 200 } 
  }
};

// Inner component that reads search parameters
const TaskListContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, deleteTask, tasksLoading } = useApp();

  // URL search query initial binding
  const searchQueryParam = searchParams.get('search') || '';

  // Local Filter States
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'expired'>('active');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate-asc');
  
  const [usersList, setUsersList] = useState<any[]>([]);

  // Delete Modal States
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Sync Search state if URL query changes
  useEffect(() => {
    setSearchQuery(searchQueryParam);
  }, [searchQueryParam]);

  // Load workspace users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await taskService.fetchAllUsers();
        setUsersList(list);
      } catch (error) {
        console.error('Failed to load users list:', error);
      }
    };
    fetchUsers();
  }, []);

  // Handle actual task deletion
  const confirmDelete = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  // Filter & Sort Logic
  const filteredTasks = tasks
    .filter((task) => {
      // 1. Tab Scope Filter
      if (activeTab === 'completed') {
        if (task.status !== 'completed') return false;
      } else if (activeTab === 'expired') {
        if (task.status !== 'expired') return false;
      } else {
        if (task.status === 'completed' || task.status === 'expired') return false;
      }

      // 2. Search Query
      const titleLower = (task.title || '').toLowerCase();
      const descLower = (task.description || '').toLowerCase();
      const queryLower = searchQuery.toLowerCase();

      const matchesSearch =
        titleLower.includes(queryLower) ||
        descLower.includes(queryLower) ||
        (task.tags || []).some(tag => (tag || '').toLowerCase().includes(queryLower));

      // 3. Status Filter (only active inside 'active' tab)
      const matchesStatus = 
        activeTab !== 'active' ||
        selectedStatus === 'all' || 
        task.status === selectedStatus;

      // 4. Priority Filter
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

      // 5. Assignee Filter
      const matchesAssignee =
        selectedAssignee === 'all' ||
        (task.assignee && task.assignee.id === selectedAssignee);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate-asc') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'dueDate-desc') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      if (sortBy === 'createdDate-desc') {
        return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
      }
      if (sortBy === 'createdDate-asc') {
        return new Date(a.createdDate || 0).getTime() - new Date(b.createdDate || 0).getTime();
      }
      if (sortBy === 'recently-updated') {
        return new Date(b.lastUpdatedDate || b.createdDate || 0).getTime() - new Date(a.lastUpdatedDate || a.createdDate || 0).getTime();
      }
      if (sortBy === 'priority-desc') {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      }
      if (sortBy === 'priority-asc') {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[a.priority] - weight[b.priority];
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
            Workspace Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, execute, and monitor your collaborative roadmap items.
          </p>
        </div>
        <Button onClick={() => router.push('/tasks/create')} size="sm" className="w-fit">
          <Plus size={16} className="mr-1.5" /> Create Task
        </Button>
      </div>

      {/* Tabs System */}
      <div className="flex border-b border-border/80 gap-1.5 pb-px">
        {(['active', 'completed', 'expired'] as const).map((tab) => {
          const count = tasks.filter((t) => {
            if (tab === 'completed') return t.status === 'completed';
            if (tab === 'expired') return t.status === 'expired';
            return t.status !== 'completed' && t.status !== 'expired';
          }).length;
          
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedStatus('all');
              }}
              className={cn(
                'relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none select-none',
                activeTab === tab
                  ? 'text-primary font-black'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative z-10">{tab} Tasks ({count})</span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTaskTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar row */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 md:top-3 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Filter tasks by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 md:h-10 pl-9 pr-4 bg-secondary border border-border/70 text-sm text-foreground rounded-lg transition-all duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-secondary"
            />
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap gap-3">
            {activeTab === 'active' && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-11 md:h-10 pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-44"
                >
                  <option value="all">All Statuses</option>
                  <option value="initiated">Initiated</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="submission-pending">Submission Pending</option>
                  <option value="submitted">Submitted</option>
                </select>
                <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
              </div>
            )}

            {/* Priority Selector */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-11 md:h-10 pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-40"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
            </div>

            {/* Assignee Selector */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="h-11 md:h-10 pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-44"
              >
                <option value="all">All Assignees</option>
                {usersList.map((u) => (
                  <option key={u.uid || u.id} value={u.uid || u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
            </div>

            {/* Sort Toggle */}
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 md:h-10 pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48"
              >
                <option value="dueDate-asc">Due Date: Soonest</option>
                <option value="dueDate-desc">Due Date: Latest</option>
                <option value="priority-desc">Priority: High to Low</option>
                <option value="priority-asc">Priority: Low to High</option>
                <option value="recently-updated">Recently Updated</option>
                <option value="createdDate-desc">Recently Created</option>
              </select>
              <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {tasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No tasks created yet"
          description="Start organizing your roadmap. Create a task to track status, priorities, and checklists."
          actionText="Create Task"
          onAction={() => router.push('/tasks/create')}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No tasks match filters"
          description="Try resetting your keyword searches, priority options, or status filters, or create a brand new task."
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedStatus('all');
            setSelectedPriority('all');
            setSelectedAssignee('all');
            setSortBy('dueDate-asc');
          }}
        />
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTasks.map((task) => (
            <motion.div key={task.id} variants={cardItemVariants} layout>
              <TaskCard
                task={task}
                onDelete={(id) => setDeletingTaskId(id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      <Modal
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        title="Delete Confirmation"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 items-start text-sm">
            <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-muted-foreground leading-relaxed">
              Are you sure you want to delete this task? This will permanently remove the item from local storage, along with any activity logging files. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingTaskId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-secondary rounded-lg" />
            <div className="h-10 w-32 bg-secondary rounded-lg" />
          </div>
          <div className="h-14 w-full bg-secondary rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-secondary rounded-lg" />
            <div className="h-48 bg-secondary rounded-lg" />
            <div className="h-48 bg-secondary rounded-lg" />
          </div>
        </div>
      }
    >
      <TaskListContent />
    </Suspense>
  );
}
