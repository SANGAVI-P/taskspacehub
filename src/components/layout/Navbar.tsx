'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, Menu, User, Settings, LogOut, CheckCircle2, Calendar, Flame, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const router = useRouter();
  const { user, notifications, logout, markNotificationRead, markAllNotificationsRead, userXP, streakCount } = useApp();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = e.currentTarget.value;
      router.push(`/tasks?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border/60">
      {/* Left section: Hamburger (mobile) + search */}
      <div className="flex items-center flex-1 space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer focus:outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Global Task Search bar */}
        <div className="relative max-w-md w-full hidden md:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/60">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search tasks... (press Enter)"
            onKeyDown={handleSearchKeyDown}
            className="w-full h-9 pl-10 pr-4 bg-secondary/60 border border-border/80 text-sm text-foreground rounded-lg transition-all duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-secondary"
          />
        </div>
      </div>

      {/* Right section: notifications + profile */}
      <div className="flex items-center space-x-3">


        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer focus:outline-none relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-40"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer focus:outline-none"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={cn(
                          'p-3.5 hover:bg-secondary/40 transition-colors cursor-pointer flex items-start gap-3',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className="mt-0.5">
                          {notif.type === 'task_due' ? (
                            <Calendar size={16} className="text-amber-500" />
                          ) : (
                            <CheckCircle2 size={16} className="text-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-semibold text-foreground', !notif.read && 'font-bold')}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {notif.description}
                          </p>
                          <span className="text-[9px] text-muted-foreground/85 block mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role Badge */}
        {user && (
          <Badge
            variant={user.role === 'admin' ? 'high' : 'in-progress'}
            className="uppercase text-[9px] font-black tracking-wider px-2 py-0.5"
          >
            {user.role === 'admin' ? 'Admin' : 'User'}
          </Badge>
        )}

        {/* User Profile dropdown */}
        <div ref={profileRef} className="relative">
          {user && (
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 focus:outline-none cursor-pointer"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-border bg-muted object-cover"
              />
            </button>
          )}

          <AnimatePresence>
            {profileOpen && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-40"
              >
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="p-1">
                  <Link href="/profile" onClick={() => setProfileOpen(false)}>
                    <div className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer select-none">
                      <User size={14} className="mr-2.5" />
                      My Profile
                    </div>
                  </Link>
                  <Link href="/settings" onClick={() => setProfileOpen(false)}>
                    <div className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer select-none">
                      <Settings size={14} className="mr-2.5" />
                      Settings
                    </div>
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none select-none text-left"
                  >
                    <LogOut size={14} className="mr-2.5" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
