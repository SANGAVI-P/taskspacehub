'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Trophy, Gift, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  xpGained: number;
  streak: number;
  totalXP: number;
  bonusXP?: number;
  TimingInfo?: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  xpGained,
  streak,
  totalXP,
  bonusXP = 0,
  TimingInfo = "",
}) => {
  const [isOpened, setIsOpened] = useState(false);

  // Auto-open gift box after 1.2s if user doesn't click
  useEffect(() => {
    if (isOpen) {
      setIsOpened(false);
      const timer = setTimeout(() => {
        setIsOpened(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden bg-card border border-border shadow-2xl rounded-2xl p-8 z-10 flex flex-col items-center text-center text-foreground"
          >
            {/* Sparkle background effects */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500 via-indigo-500 to-transparent" />

            <AnimatePresence mode="wait">
              {!isOpened ? (
                /* Unopened Gift State */
                <motion.div
                  key="gift-unopened"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center space-y-6 my-8 cursor-pointer select-none"
                  onClick={() => setIsOpened(true)}
                >
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, -4, 4, -4, 4, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      ease: "easeInOut"
                    }}
                    className="h-28 w-28 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-purple-400 relative"
                  >
                    <Gift size={56} className="text-white" />
                    {/* Pulsing ring indicator */}
                    <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping opacity-60" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                      A Gift Awaits!
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Tap the box to open your task completion reward and claim your points.
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Opened Reward State */
                <motion.div
                  key="gift-opened"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  className="space-y-6 my-4 w-full flex flex-col items-center"
                >
                  {/* Floating Sparkles & Icons */}
                  <div className="relative flex justify-center items-center h-28 w-full mb-2">
                    {/* Ring glow */}
                    <motion.div 
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute h-24 w-24 bg-indigo-500/20 rounded-full blur-xl"
                    />

                    {/* Sparkle Icons */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                      className="absolute left-[30%] top-4 text-purple-400"
                    >
                      <Sparkles size={24} className="animate-pulse" />
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
                      className="absolute right-[30%] top-8 text-blue-400"
                    >
                      <Sparkles size={18} />
                    </motion.div>

                    {/* Main Trophy Icon */}
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.15 }}
                      className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/25 border border-yellow-300 relative z-10"
                    >
                      <Trophy size={38} className="text-white" />
                    </motion.div>
                  </div>

                  {/* Congratulations Text */}
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-1.5 animate-bounce">
                      Task Completed! 🎉
                    </h2>
                    <p className="text-sm text-indigo-400 font-extrabold max-w-sm mx-auto line-clamp-2 leading-snug px-4">
                      "{taskTitle}"
                    </p>
                    {TimingInfo && (
                      <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        {TimingInfo}
                      </p>
                    )}
                  </div>

                  {/* Gamification Badges Grid */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-2">
                    {/* XP Card */}
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-secondary/45 border border-border/80 p-3.5 rounded-xl text-center flex flex-col items-center relative overflow-hidden group hover:border-primary/40 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-1.5">
                        <Sparkles size={16} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">XP Reward</span>
                      <span className="text-base font-black text-indigo-400 mt-0.5">+{xpGained} XP</span>
                      {bonusXP > 0 && (
                        <span className="text-[9.5px] font-black text-emerald-400 mt-0.5 flex items-center gap-0.5 animate-pulse">
                          +{bonusXP} Speed Bonus! 🔥
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground mt-1.5 border-t border-border/40 pt-1 w-full">Total: {totalXP} XP</span>
                    </motion.div>

                    {/* Streak Card */}
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="bg-secondary/45 border border-border/80 p-3.5 rounded-xl text-center flex flex-col items-center relative overflow-hidden group hover:border-orange-500/40 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mb-1.5">
                        <Flame size={16} className={cn("animate-bounce", streak === 0 && "opacity-45")} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">On-Time Streak</span>
                      <span className="text-base font-black text-orange-500 mt-0.5">{streak} Days</span>
                      <span className={cn(
                        "text-[9px] font-bold mt-1.5 border-t border-border/40 pt-1 w-full",
                        streak > 0 ? "text-orange-400" : "text-rose-400"
                      )}>
                        {streak > 0 ? "Due-Date Streak Active" : "Streak Reset"}
                      </span>
                    </motion.div>
                  </div>

                  {/* Actions */}
                  <div className="w-full max-w-xs pt-4">
                    <Button onClick={onClose} variant="primary" className="w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-md shadow-indigo-500/20 hover:from-purple-700 hover:to-indigo-700">
                      Awesome, Let's Go! <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
