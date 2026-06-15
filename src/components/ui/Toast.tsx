'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'pointer-events-auto flex items-start p-4 bg-card border border-border shadow-xl rounded-xl w-full overflow-hidden relative',
              toast.type === 'success' && 'border-emerald-500/20 shadow-emerald-950/5',
              toast.type === 'error' && 'border-rose-500/20 shadow-rose-950/5',
              toast.type === 'info' && 'border-indigo-500/20 shadow-indigo-950/5'
            )}
          >
            {/* Type Indicator Bar */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1',
                toast.type === 'success' && 'bg-emerald-500',
                toast.type === 'error' && 'bg-rose-500',
                toast.type === 'info' && 'bg-indigo-500'
              )}
            />

            {/* Icon */}
            <div className="flex-shrink-0 mr-3">
              {toast.type === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-rose-500" size={20} />}
              {toast.type === 'info' && <Info className="text-indigo-500" size={20} />}
            </div>

            {/* Message */}
            <div className="flex-1 text-sm font-medium text-foreground pr-4">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
