import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-border/80 border-dashed rounded-2xl">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary text-muted-foreground border border-border/50 mb-4 shadow-inner">
        <Icon size={28} className="text-muted-foreground/75" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="shadow-sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};
