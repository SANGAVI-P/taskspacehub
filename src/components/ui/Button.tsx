'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none rounded-lg select-none cursor-pointer';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-opacity-90 shadow-[0_2px_8px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35)]',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-opacity-80 border border-border',
      outline: 'bg-transparent border border-border hover:bg-secondary text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-opacity-90 shadow-[0_2px_8px_rgba(239,68,68,0.2)]',
      ghost: 'bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs font-semibold md:h-8',
      md: 'h-11 px-4 text-sm font-semibold md:h-10',
      lg: 'h-12 px-6 text-base font-semibold',
      icon: 'h-11 w-11 p-0 md:h-10 md:w-10',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
