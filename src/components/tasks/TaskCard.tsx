'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, CheckSquare, Edit, Trash2 } from 'lucide-react';
import { Task } from '../../types/task';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate, cn } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete }) => {
  const { id, title, description, status, priority, dueDate, subtasks } = task;

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressVal = task.progressPercent !== undefined ? task.progressPercent : (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0);

  const isExpired = status === 'expired';
  const isSubmissionActive = status === 'initiated' || status === 'assigned' || status === 'in-progress' || status === 'submission-pending';
  const isSubmitted = status === 'submitted';
  
  let overdueDays = 0;
  if (isExpired && dueDate) {
    const dueTime = new Date(dueDate).getTime();
    const nowTime = new Date().getTime();
    if (nowTime > dueTime) {
      overdueDays = Math.ceil((nowTime - dueTime) / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <motion.div
      layout
      whileHover={{ 
        y: -6, 
        scale: 1.01, 
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.99 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-xl hover:border-border/95 flex flex-col justify-between h-full group transition-shadow duration-200 select-none relative overflow-hidden"
    >
      <div className="space-y-3.5">
        {/* Card Header: Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap items-center">
            <Badge variant={status}>{status.replace('-', ' ')}</Badge>
            <Badge variant={priority}>{priority}</Badge>
            {isExpired && overdueDays > 0 && (
              <Badge variant="high" className="animate-pulse">Overdue by {overdueDays} day{overdueDays > 1 ? 's' : ''}</Badge>
            )}
            {isSubmissionActive && (
              <Badge 
                variant="medium" 
                className="animate-pulse flex items-center gap-1 text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 uppercase tracking-wider"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Action Required
              </Badge>
            )}
          </div>
          
          <span className="text-[10px] text-muted-foreground flex items-center bg-secondary px-2 py-0.5 rounded-full border border-border/40 font-medium">
            <Calendar size={11} className="mr-1" />
            {formatDate(dueDate)}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <Link href={`/tasks/${id}`}>
            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Progress bar visualizer */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center">
              <CheckSquare size={11} className="mr-1 text-primary animate-pulse" />
              {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} Checklist` : 'Platform Progress'}
            </span>
            <span>{progressVal}%</span>
          </div>
          {/* Progress bar container */}
          <div className="h-1 bg-secondary rounded-full overflow-hidden w-full border border-border/25">
            <motion.div 
              className={cn("h-full rounded-full", isExpired ? "bg-rose-500" : "bg-primary")}
              initial={{ width: 0 }}
              animate={{ width: `${progressVal}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="border-t border-border/60 pt-4 mt-5 flex items-center justify-between gap-3">
        <div className="flex-1">
          {isSubmissionActive ? (
            <Link href={`/tasks/${id}?submit=true`} className="w-full block">
              <Button 
                size="sm" 
                variant="primary" 
                className="w-full text-[11px] h-11 md:h-8.5 font-extrabold flex items-center justify-center gap-1 shadow-sm hover:shadow"
              >
                🚀 Publish It
              </Button>
            </Link>
          ) : isSubmitted ? (
            <Link href={`/tasks/${id}`} className="w-full block">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-[11px] h-11 md:h-8.5 font-extrabold border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 shadow-sm hover:shadow"
              >
                View Submission
              </Button>
            </Link>
          ) : (
            <Link href={`/tasks/${id}`} className="w-full block">
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full text-[11px] h-11 md:h-8.5 font-extrabold flex items-center justify-center gap-1"
              >
                🚀 Publish It
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link href={`/tasks/${id}/edit`}>
            <Button variant="ghost" size="icon" className="h-11 w-11 md:h-8.5 md:w-8.5 hover:bg-secondary" title="Edit task">
              <Edit size={14} className="text-muted-foreground hover:text-foreground" />
            </Button>
          </Link>
          <Button
            onClick={() => onDelete(id)}
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-8.5 md:w-8.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
            title="Delete task"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
