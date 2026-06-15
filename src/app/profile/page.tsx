'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Edit3, 
  ListTodo, 
  CheckCircle2, 
  Clock,
  Briefcase,
  ShieldCheck,
  Flame,
  Trophy,
  Award,
  Zap,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { formatDate, cn } from '../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ProfilePage() {
  const router = useRouter();
  const { user, tasks, logout, showToast, userXP, streakCount, bestStreak } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, { name: name.trim() });
      showToast('Profile name updated', 'success');
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      showToast('Failed to update profile name', 'error');
    }
  };

  // User Stats
  const assignedTasks = tasks;
  const completedCount = assignedTasks.filter(t => t.status === 'completed').length;
  const activeCount = assignedTasks.filter(t => t.status !== 'completed' && t.status !== 'expired').length;

  // Level & XP calculations
  const currentLevel = Math.floor(userXP / 500) + 1;
  const levelXPProgress = userXP % 500;

  // Early completion check (completed >= 2 days early)
  const hasEarlyCompletion = tasks.some((task) => {
    if (task.status !== 'completed' || !task.lastUpdatedDate) return false;
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    const completed = new Date(task.lastUpdatedDate);
    const diffMs = due.getTime() - completed.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 2;
  });

  const badges = [
    {
      id: 'pioneer',
      title: 'Pioneer',
      description: 'Joined Task Space Hub community',
      unlocked: true,
      color: 'from-purple-500 to-indigo-500',
      icon: Award,
    },
    {
      id: 'task_master',
      title: 'Task Master',
      description: 'Completed 5+ workspace tasks',
      unlocked: completedCount >= 5,
      color: 'from-emerald-400 to-teal-500',
      icon: CheckCircle2,
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Delivered a task 2+ days early',
      unlocked: hasEarlyCompletion,
      color: 'from-amber-400 to-orange-500',
      icon: Zap,
    },
    {
      id: 'unstoppable',
      title: 'Unstoppable',
      description: 'On-time streak of 5+ tasks',
      unlocked: bestStreak >= 5,
      color: 'from-rose-500 to-red-600',
      icon: Flame,
    },
    {
      id: 'elite',
      title: 'Elite Performer',
      description: 'Level 3 reached (1000+ XP)',
      unlocked: currentLevel >= 3,
      color: 'from-yellow-400 to-amber-500',
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account credentials, review task statistics, and monitor your gamified workspace rank.
        </p>
      </div>

      {/* Profile Card Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Avatar details */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-sm h-fit">
          <div className="relative mb-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={user?.name || 'User Avatar'}
              className="h-24 w-24 rounded-full border border-border shadow-md object-cover bg-muted"
            />
          </div>
          
          <h2 className="text-lg font-bold text-foreground">{user?.name || 'Guest'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email || 'guest@example.com'}</p>

          <Badge variant="default" className="mt-3.5 uppercase font-bold text-[9px] bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
            {user?.role || 'Member'}
          </Badge>

          {/* Action Row */}
          <div className="w-full mt-6 pt-6 border-t border-border flex flex-col gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="secondary" className="w-full text-xs h-9 bg-secondary text-foreground hover:bg-secondary/80 border border-border">
                <Edit3 size={13} className="mr-1.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button onClick={handleSave} className="flex-1 text-xs h-9 bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 text-xs h-9 border-border text-foreground hover:bg-secondary">
                  Cancel
                </Button>
              </div>
            )}
            <Button onClick={handleLogout} variant="ghost" className="w-full text-xs h-9 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
              <LogOut size={13} className="mr-1.5" /> Logout
            </Button>
          </div>
        </div>

        {/* Right Details Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Form inputs */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-foreground pb-4 border-b border-border mb-6">
              Account Details
            </h3>

            {!isEditing ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Full Name</span>
                    <span className="font-semibold text-foreground">{user?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Email Address</span>
                    <span className="font-semibold text-foreground">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Joined Date</span>
                    <span className="font-semibold text-foreground">
                      {user?.joinedDate ? formatDate(user.joinedDate) : 'Jan 10, 2026'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase size={16} className="text-slate-450 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Access Role</span>
                    <span className="font-semibold text-foreground uppercase text-xs">{user?.role || 'Member'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  helperText="Email changes are managed via Firebase auth settings."
                />
              </div>
            )}
          </div>

          {/* User Workspace Insights statistics widgets */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">Workspace Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <ListTodo size={20} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-foreground block">{assignedTasks.length}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Assigned</span>
              </motion.div>
 
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-foreground block">{completedCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Completed</span>
              </motion.div>
 
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Clock size={20} className="text-amber-600 dark:text-amber-400 mx-auto mb-1.5" />
                <span className="text-2xl font-black text-foreground block">{activeCount}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active</span>
              </motion.div>
            </div>
          </div>

          {/* Gamification Progress & Streak Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center">
                <ShieldCheck size={16} className="mr-1.5 text-[#7C5CFF]" /> Gamification & Progress
              </h3>
              <span className="text-xs font-bold text-[#7C5CFF]">Level {currentLevel}</span>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Level progression slider widget */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">XP Progress</span>
                  <span className="font-extrabold text-foreground">{levelXPProgress} / 500 XP</span>
                </div>
                <div className="h-3.5 bg-secondary rounded-full overflow-hidden p-[2px] border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(levelXPProgress / 500) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-inner relative"
                  >
                    <span className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </motion.div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Earn XP by completing tasks. Every task completed awards **+10 XP** directly. Reach 500 XP to level up!
                </p>
              </div>
 
              {/* Streak summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 border border-border/80 p-3.5 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Flame size={20} className={streakCount > 0 ? "animate-bounce" : "opacity-55"} />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Current Streak</span>
                    <span className="text-lg font-black text-foreground">{streakCount} Days</span>
                  </div>
                </div>
 
                <div className="bg-secondary/40 border border-border/80 p-3.5 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 flex-shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Best Streak</span>
                    <span className="text-lg font-black text-foreground">{bestStreak} Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-5 pb-3 border-b border-border flex items-center">
              <Award size={16} className="mr-1.5 text-[#7C5CFF]" /> Achievement Badges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.03 }}
                    className={cn(
                      "relative border rounded-2xl p-4 flex flex-col items-center text-center transition-all overflow-hidden h-full",
                      badge.unlocked 
                        ? "bg-card border-border shadow-md"
                        : "bg-secondary/40 border-dashed border-border opacity-60 grayscale"
                    )}
                  >
                    {/* Background glow for unlocked badges */}
                    {badge.unlocked && (
                      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 to-transparent" />
                    )}

                    {/* Badge Icon container */}
                    <div className="relative mb-3 flex items-center justify-center">
                      <div className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center relative",
                        badge.unlocked 
                          ? `bg-gradient-to-tr ${badge.color} text-white shadow-lg`
                          : "bg-secondary text-muted-foreground"
                      )}>
                        <IconComponent size={24} />
                      </div>
                      
                      {/* Lock overlay for locked badges */}
                      {!badge.unlocked && (
                        <div className="absolute -bottom-1 -right-1 bg-secondary border border-border p-1 rounded-full text-muted-foreground shadow-sm">
                          <Lock size={10} />
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-foreground mb-1">
                      {badge.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      {badge.description}
                    </p>

                    {/* Unlocked status tag */}
                    <div className="mt-auto pt-3 w-full">
                      {badge.unlocked ? (
                        <span className="text-[9px] font-bold text-[#7C5CFF] bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 px-2 py-0.5 rounded-full inline-block">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full inline-block">
                          Locked
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
