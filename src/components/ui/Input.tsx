'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, containerClassName, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <motion.div 
        animate={error ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.3 } } : {}}
        className={cn('flex flex-col space-y-1 w-full', containerClassName)}
      >
        {label && (
          <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3 py-2 md:h-10 bg-secondary border border-border text-sm text-foreground rounded-lg transition-all duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] disabled:opacity-50 disabled:pointer-events-none',
              error && 'border-destructive focus:border-destructive focus:ring-destructive focus:shadow-[0_0_12px_rgba(239,68,68,0.15)]',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error ? (
          <motion.span 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive font-medium"
          >
            {error}
          </motion.span>
        ) : helperText ? (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </motion.span>
        ) : null}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';
