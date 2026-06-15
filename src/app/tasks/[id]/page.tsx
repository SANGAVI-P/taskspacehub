'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square,
  AlertCircle,
  Tag,
  User,
  History,
  Link2,
  Code,
  Globe,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Task, TaskStatus, SubTask } from '../../../types/task';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Loader, TaskDetailsSkeleton } from '../../../components/ui/Loader';
import { formatDate } from '../../../lib/utils';
import canvasConfetti from 'canvas-confetti';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface TaskDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { tasks, logs, updateTask, deleteTask, loading, tasksLoading, user: currentUser } = useApp();

  const [task, setTask] = useState<Task | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Submission Form States
  const [subUrl, setSubUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [subNotes, setSubNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  useEffect(() => {
    if (!loading && !tasksLoading) {
      const foundTask = tasks.find((t) => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
  }, [id, tasks, loading, tasksLoading]);

  // Sync submission inputs if task changes or already has submission values
  useEffect(() => {
    if (task && task.submission) {
      setSubUrl(task.submission.submissionUrl || '');
      setGithubUrl(task.submission.githubUrl || '');
      setLiveUrl(task.submission.liveDemoUrl || '');
      setDriveUrl(task.submission.driveLink || '');
      setSubNotes(task.submission.notes || '');
      setAttachmentName(task.submission.attachmentName || '');
    }
  }, [task]);

  // Check for search parameter `submit` to smooth-scroll
  useEffect(() => {
    if (typeof window !== 'undefined' && task) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('submit') === 'true') {
        const timer = setTimeout(() => {
          const element = document.getElementById('submission-panel');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const firstInput = element.querySelector('input');
            if (firstInput) (firstInput as HTMLInputElement).focus();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [id, task]);

  if (loading || tasksLoading) {
    return (
      <div className="space-y-6">
        <TaskDetailsSkeleton />
      </div>
    );
  }

  if (notFound || !task) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-border rounded-2xl max-w-md mx-auto mt-10">
        <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">Task Not Found</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The task you are looking for does not exist in this workspace or has been removed.
        </p>
        <Link href="/tasks">
          <Button variant="secondary" size="sm">
            Back to tasks
          </Button>
        </Link>
      </div>
    );
  }

  // Toggling Subtask inside Details view
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) => {
      if (st.id === subtaskId) {
        const nextState = !st.completed;
        
        // If all subtasks are now completed, let's fire confetti!
        const willBeCompleted = nextState;
        const otherSubtasksCompleted = task.subtasks
          .filter(s => s.id !== subtaskId)
          .every(s => s.completed);

        if (willBeCompleted && otherSubtasksCompleted) {
          canvasConfetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.75 },
            colors: ['#6366f1', '#a855f7', '#10b981']
          });
        }
        
        return { ...st, completed: nextState };
      }
      return st;
    });

    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  // Changing Status directly from details sidebar dropdown
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    updateTask(task.id, { status: newStatus });
    
    // Celebrate if marked completed
    if (newStatus === 'completed') {
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Assignee updates progress slider
  const handleProgressChange = (newVal: number) => {
    let nextStatus = task.status;
    if (newVal > 0 && newVal < 100 && (task.status === 'initiated' || task.status === 'assigned')) {
      nextStatus = 'in-progress';
    } else if (newVal === 100 && (task.status === 'in-progress' || task.status === 'assigned' || task.status === 'initiated')) {
      nextStatus = 'submission-pending';
    } else if (newVal === 0 && task.status === 'in-progress') {
      nextStatus = 'assigned';
    }

    updateTask(task.id, { 
      progressPercent: newVal,
      status: nextStatus
    });
  };

  // Handle Submission submit
  const handleSubmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      submissionUrl: subUrl,
      githubUrl: githubUrl,
      liveDemoUrl: liveUrl,
      driveLink: driveUrl,
      notes: subNotes,
      attachmentName: attachmentName || undefined,
      submittedAt: new Date().toISOString(),
    };

    updateTask(task.id, {
      submission: submissionData,
      status: 'submitted',
      progressPercent: 100
    });

    canvasConfetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.7 }
    });
  };

  const handleDeleteConfirm = () => {
    deleteTask(task.id);
    setDeleteOpen(false);
    router.push('/tasks');
  };

  // Determine permissions
  const isCreatorOrAdmin = currentUser && (currentUser.id === task.creatorId || currentUser.role === 'admin' || !task.creatorId);

  // Sorting timeline logs oldest-first (chronological order)
  const taskLogs = [...logs]
    .filter((log) => log.taskId === task.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const progressPercent = task.progressPercent !== undefined ? task.progressPercent : (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Back Button breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Back to tasks
        </span>
      </div>

      {/* Action Required Banner */}
      {(task.status === 'in-progress' || task.status === 'submission-pending') && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Action Required: Task Pending Submission</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                This task is currently active. Once your work is ready, please complete the submission form below to deliver your project assets.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('submission-panel');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const input = el.querySelector('input');
                if (input) input.focus();
              }
            }}
            className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shrink-0 text-left sm:text-right cursor-pointer focus:outline-none"
          >
            Go to Submission Panel &rarr;
          </button>
        </motion.div>
      )}

      {/* Main Grid: Details (Left) + Metadata Widget (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Title, tags, description, subtasks checklist, submission card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            {/* Title & tags */}
            <div className="space-y-3.5">
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">
                {task.title}
              </h1>

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Tag size={12} className="text-muted-foreground mr-1" />
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide bg-secondary border border-border/70 text-muted-foreground rounded-md uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-border/60 pt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Description
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>

            {/* Task URL Reference */}
            {task.taskUrl && (
              <div className="border-t border-border/60 pt-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Reference Link / Image
                </h3>
                {/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(task.taskUrl) || task.taskUrl.startsWith('data:image/') ? (
                  <div className="mt-2 rounded-xl overflow-hidden border border-border/80 max-w-lg bg-secondary/35">
                    <img 
                      src={task.taskUrl} 
                      alt="Task Reference Preview" 
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                ) : (
                  <a href={task.taskUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1">
                    <Link2 size={13} /> {task.taskUrl}
                  </a>
                )}
              </div>
            )}

            {/* Checklist */}
            {totalSubtasks > 0 && (
              <div className="border-t border-border/60 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Checklist ({completedSubtasks}/{totalSubtasks})
                  </h3>
                  <span className="text-xs font-bold text-primary">{progressPercent}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden w-full border border-border/25">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Subtask list checkboxes */}
                <div className="bg-secondary/20 border border-border/60 rounded-xl p-4 space-y-3">
                  {task.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-3 text-sm cursor-pointer select-none group"
                    >
                      {st.completed ? (
                        <CheckSquare size={18} className="text-primary flex-shrink-0" />
                      ) : (
                        <Square size={18} className="text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                      )}
                      <span className={`text-foreground transition-all ${st.completed && 'line-through text-muted-foreground'}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Section */}
          {task.status !== 'completed' && task.status !== 'expired' ? (
            <div id="submission-panel" className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm scroll-mt-20">
              <div>
                <h3 className="text-base font-bold text-foreground">Task Submission Panel</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Fill in project URLs and optional files to deliver your task scope.</p>
              </div>
              
              <form onSubmit={handleSubmissionSubmit} className="space-y-4 border-t border-border/60 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Submission URL / Image URL (any link or image)</label>
                    <input
                      type="text"
                      placeholder="https://example.com/screenshot.png or any project URL"
                      value={subUrl}
                      onChange={(e) => setSubUrl(e.target.value)}
                      className="w-full h-11 md:h-10 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">GitHub Repository URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full h-11 md:h-10 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Live Demo URL</label>
                    <input
                      type="url"
                      placeholder="https://my-app.vercel.app"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="w-full h-11 md:h-10 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Google Drive Link</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      className="w-full h-11 md:h-10 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Submission Notes</label>
                  <textarea
                    placeholder="Provide details on features implemented, deployment guide, or test credentials..."
                    rows={4}
                    value={subNotes}
                    onChange={(e) => setSubNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Optional File Attachment Name</label>
                  <input
                    type="text"
                    placeholder="e.g. project_assets_v2.zip"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full h-11 md:h-10 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full h-11 md:h-10 text-xs font-semibold">
                  Submit Task
                </Button>
              </form>
            </div>
          ) : task.submission ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/60 uppercase tracking-wider text-emerald-500">
                Submitted Assets & Links
              </h3>
              
              <div className="space-y-4 text-xs">
                {task.submission.submissionUrl && (
                  <div className="py-2.5 border-b border-border/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Link2 size={13} /> Submission Link:
                      </span>
                      <a href={task.submission.submissionUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                        {task.submission.submissionUrl}
                      </a>
                    </div>
                    {/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(task.submission.submissionUrl) || task.submission.submissionUrl.startsWith('data:image/') ? (
                      <div className="mt-2 rounded-xl overflow-hidden border border-border/80 max-w-lg bg-secondary/35">
                        <img 
                          src={task.submission.submissionUrl} 
                          alt="Submitted Deliverable Preview" 
                          className="w-full h-auto max-h-[300px] object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                
                {task.submission.githubUrl && (
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Code size={13} /> GitHub Repo:
                    </span>
                    <a href={task.submission.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                      {task.submission.githubUrl}
                    </a>
                  </div>
                )}

                {task.submission.liveDemoUrl && (
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Globe size={13} /> Live Demo:
                    </span>
                    <a href={task.submission.liveDemoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                      {task.submission.liveDemoUrl}
                    </a>
                  </div>
                )}

                {task.submission.driveLink && (
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <FolderOpen size={13} /> Google Drive Link:
                    </span>
                    <a href={task.submission.driveLink} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                      {task.submission.driveLink}
                    </a>
                  </div>
                )}

                {task.submission.attachmentName && (
                  <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground">Attachment:</span>
                    <span className="font-semibold text-foreground">{task.submission.attachmentName}</span>
                  </div>
                )}

                {task.submission.notes && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Submission Notes:</span>
                    <p className="p-3 bg-secondary rounded-lg border border-border text-foreground whitespace-pre-wrap leading-relaxed">
                      {task.submission.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Activity Timeline logs */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
              <History size={13} className="mr-1.5 text-primary" /> Task Activity Timeline (Status History)
            </h3>

            {taskLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground/85 italic">
                No modifications logged for this task yet.
              </p>
            ) : (
              <div className="space-y-4.5 relative pl-4 border-l border-border/80">
                {taskLogs.map((log) => (
                  <div key={log.id} className="relative text-xs leading-normal">
                    {/* Circle Node indicator */}
                    <div className="absolute -left-[20.5px] top-1 h-2 w-2 rounded-full border border-primary bg-background flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <span className="font-bold text-indigo-400">{log.userName}</span>{' '}
                        {log.action}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 block mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Widgets dashboard detail variables */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm sticky top-22">
          <h3 className="text-sm font-bold text-foreground pb-3.5 border-b border-border/80">
            Task Metadata
          </h3>

          <div className="space-y-4 text-xs">
            {/* Status Dropdown */}
            <div className="flex flex-col space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
              <div className="relative">
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  className="h-9 w-full pl-3 pr-8 bg-secondary border border-border text-xs text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value="initiated">Initiated</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="submission-pending">Submission Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
              </div>
            </div>

            {/* Interactive Progress Slider */}
            <div className="flex flex-col space-y-1.5 py-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Task Progress</span>
                <span className="font-extrabold text-primary">{task.progressPercent || 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={task.progressPercent || 0}
                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={task.status === 'completed' || task.status === 'expired'}
              />
              <span className="text-[9px] text-muted-foreground/85">Slide to adjust work completion status</span>
            </div>

            {/* Priority */}
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</span>
              <Badge variant={task.priority}>{task.priority}</Badge>
            </div>

            {/* Due Date */}
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                <Calendar size={11} className="mr-1 text-muted-foreground" /> Due Date
              </span>
              <span className="font-semibold text-foreground">{formatDate(task.dueDate)}</span>
            </div>

            {/* Created Date */}
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                <Clock size={11} className="mr-1 text-muted-foreground" /> Created
              </span>
              <span className="font-semibold text-foreground">{formatDate(task.createdDate)}</span>
            </div>

            {/* Assignee */}
            <div className="flex flex-col space-y-1.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignee</span>
              {task.assignee ? (
                <div className="flex items-center px-3 py-2 bg-secondary/40 border border-border/60 rounded-xl">
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="h-7 w-7 rounded-full border border-border bg-muted object-cover flex-shrink-0"
                  />
                  <div className="ml-2.5 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate block">{task.assignee.name}</span>
                    {task.assignedDate && (
                      <span className="text-[9px] text-muted-foreground block mt-0.5">Assigned {formatDate(task.assignedDate)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-secondary/40 border border-border/60 rounded-xl text-muted-foreground">
                  <User size={14} className="mr-2" /> Unassigned
                </div>
              )}
            </div>
          </div>

          {/* Admin Completion Review Panel */}
          {task.status === 'submitted' && isCreatorOrAdmin && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4 mt-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Review Submission
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  As the creator or workspace administrator, you can review the submitted links and approve this task.
                </p>
              </div>
              <Button
                onClick={() => updateTask(task.id, { status: 'completed' })}
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none h-9 text-xs font-semibold"
              >
                Approve & Mark Completed
              </Button>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
            <Link href={`/tasks/${task.id}/edit`} className="w-full">
              <Button variant="secondary" className="w-full h-9 text-xs">
                <Edit size={13} className="mr-1.5" /> Edit Task
              </Button>
            </Link>
            <Button
              onClick={() => setDeleteOpen(true)}
              variant="destructive"
              className="w-full h-9 text-xs"
            >
              <Trash2 size={13} className="mr-1.5" /> Delete Task
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
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
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
