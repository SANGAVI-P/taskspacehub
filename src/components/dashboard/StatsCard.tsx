import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  description?: string;
}

const CountUp: React.FC<{ value: number; duration?: number }> = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [value, duration]);

  return <>{count}</>;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  description,
}) => {
  return (
    <motion.div 
      whileHover={{ 
        y: -4, 
        scale: 1.01,
        transition: { type: 'spring', stiffness: 350, damping: 20 }
      }}
      whileTap={{ scale: 0.99 }}
      className="bg-card border border-border p-6 rounded-2xl flex items-center transition-all duration-200 hover:shadow-lg hover:border-border/85 select-none relative overflow-hidden group cursor-pointer"
    >
      {/* Background decoration */}
      <div className={cn("absolute -right-4 -bottom-4 h-16 w-16 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-300", bgColor)} />

      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border border-current/10 mr-4.5 flex-shrink-0 shadow-sm", bgColor, iconColor)}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline space-x-1.5 mt-1">
          <span className="text-2xl font-black text-foreground tracking-tight">
            <CountUp value={value} />
          </span>
          {description && (
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
