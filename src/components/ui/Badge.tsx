import React from 'react';
import { cn } from '../../lib/utils';
import { Priority, TaskStatus } from '../../types/task';
import { motion } from 'framer-motion';

interface BadgeProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | Priority | TaskStatus;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children }) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors select-none';
  
  const styles: Record<string, string> = {
    // Default system variants
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'bg-transparent text-foreground border-border',
    
    // Task Statuses
    'todo': 'bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/50',
    'initiated': 'bg-slate-100 text-slate-700 border-slate-200/50 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/50',
    'assigned': 'bg-sky-50 text-sky-700 border-sky-100/80 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30',
    'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-100/80 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
    'submission-pending': 'bg-amber-50 text-amber-700 border-amber-100/80 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    'submitted': 'bg-purple-50 text-purple-700 border-purple-100/80 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
    'completed': 'bg-emerald-50 text-emerald-700 border-emerald-100/80 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    'expired': 'bg-rose-50 text-rose-700 border-rose-100/80 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
    
    // Priorities
    'low': 'bg-slate-100 text-slate-600 border-slate-200/40 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700/30',
    'medium': 'bg-amber-50 text-amber-700 border-amber-100/70 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/25',
    'high': 'bg-rose-50 text-rose-700 border-rose-100/70 dark:bg-rose-950/15 dark:text-rose-400 dark:border-rose-900/25',
  };

  const selectedStyle = styles[variant] || styles.default;

  return (
    <motion.span 
      whileHover={{ scale: 1.04, transition: { duration: 0.1 } }}
      className={cn(baseStyles, selectedStyle, className)}
    >
      {children}
    </motion.span>
  );
};
