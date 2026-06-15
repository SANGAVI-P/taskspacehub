import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'shimmer rounded-md',
        className
      )}
    />
  );
};

export const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent text-primary',
          sizes[size]
        )}
      />
    </div>
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border p-6 rounded-xl flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
};

export const TaskCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="border-t border-border/50 pt-4 flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const TaskDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-1/2" />
          <div className="flex space-x-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl space-y-4 h-fit">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
