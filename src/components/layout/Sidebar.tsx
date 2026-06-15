'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  Users, 
  Trophy, 
  BarChart2, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sun, 
  Moon,
  Menu,
  X,
  ShieldCheck,
  Flame,
  Sparkles,
  UserCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const LogoIcon = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D4FF" />
        <stop offset="100%" stopColor="#7C5CFF" />
      </linearGradient>
    </defs>
    <path d="M20 6L9 17L4 12" stroke="url(#logoGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, theme, toggleTheme, userXP, streakCount } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', href: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  };

  const renderNavLinks = (isMobile = false) => {
    const navVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.04,
          delayChildren: 0.05
        }
      }
    };

    const linkVariants = {
      hidden: { opacity: 0, x: -10 },
      show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } }
    };

    return (
      <motion.nav 
        variants={navVariants}
        initial="hidden"
        animate="show"
        className="flex-1 px-3 py-6 space-y-1 overflow-y-auto"
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <motion.div 
              key={item.name} 
              variants={linkVariants} 
              whileHover={{ x: 4, transition: { duration: 0.15 } }} 
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <Link href={item.href} onClick={() => isMobile && setMobileOpen(false)} className="block w-full">
                <div
                  className={cn(
                    'relative flex items-center px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer mb-1 select-none overflow-hidden',
                    isActive
                      ? 'text-primary font-bold bg-primary/5 border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId={isMobile ? "activeSidebarLinkMobile" : "activeSidebarLinkDesktop"}
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/0 rounded-lg z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center w-full">
                    <Icon size={18} className={cn('flex-shrink-0 transition-transform duration-200', isActive ? 'text-primary' : 'text-muted-foreground', !collapsed || isMobile ? 'mr-3' : 'mx-auto')} />
                    {(!collapsed || isMobile) && (
                      <span className={cn('font-semibold', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.name}</span>
                    )}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    );
  };

  return (
    <>
      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Mobile Sidebar Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-card border-r border-border"
            >
              {/* Close Button */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-border/80">
                <div className="flex items-center space-x-2">
                  <LogoIcon />
                  <span className="text-base font-black tracking-tight select-none whitespace-nowrap">
                    <span className="text-[#7C5CFF] dark:text-[#00D4FF]">TASK </span>
                    <span className="text-slate-900 dark:text-white">SPACE </span>
                    <span className="text-[#7C5CFF] dark:text-[#00D4FF]">HUB</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary cursor-pointer focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              {renderNavLinks(true)}

              {/* Bottom Actions for Mobile */}
              <div className="p-4 border-t border-border space-y-3">

                
                <div className="flex items-center justify-between px-3">
                  <span className="text-xs text-muted-foreground font-semibold">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 bg-secondary rounded-lg border border-border text-foreground hover:text-primary cursor-pointer focus:outline-none"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none"
                >
                  <LogOut size={20} className="mr-3" />
                  Logout
                </button>

                {user && (
                  <div className="flex items-center px-3 py-2 bg-secondary/50 rounded-xl border border-border/40">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-border bg-muted"
                    />
                    <div className="ml-3 overflow-hidden">
                      <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial="expanded"
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden lg:flex flex-col h-[calc(100vh-2rem)] sticky top-4 my-4 ml-4 bg-card/75 backdrop-blur-md border border-border/70 rounded-2xl z-20 flex-shrink-0 shadow-xl shadow-black/15 overflow-hidden"
      >
        {/* Header Title */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/80">
          {(!collapsed) ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <LogoIcon />
              <span className="text-base font-black tracking-tight select-none whitespace-nowrap">
                <span className="text-[#7C5CFF] dark:text-[#00D4FF]">TASK </span>
                <span className="text-slate-900 dark:text-white">SPACE </span>
                <span className="text-[#7C5CFF] dark:text-[#00D4FF]">HUB</span>
              </span>
            </motion.div>
          ) : (
            <div className="h-7 w-7 mx-auto flex items-center justify-center">
              <LogoIcon />
            </div>
          )}

          {/* Collapse Button Toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary p-1 rounded-md transition-colors cursor-pointer focus:outline-none"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center py-2 border-b border-border/40">
            <button
              onClick={() => setCollapsed(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary p-1 rounded-md transition-colors cursor-pointer focus:outline-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Links */}
        {renderNavLinks(false)}

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme & Collapse Actions */}
          <div className={cn('flex items-center justify-between', collapsed ? 'flex-col space-y-3' : 'px-2')}>
            {theme && (
              <button
                onClick={toggleTheme}
                className="p-2 bg-secondary rounded-lg border border-border text-foreground hover:text-primary cursor-pointer focus:outline-none"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer focus:outline-none"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>



          {/* User profile section at the bottom */}
          {user && (
            <div
              className={cn(
                'flex items-center border border-border/40 bg-secondary/30 rounded-xl transition-all duration-200',
                collapsed ? 'p-1.5 justify-center' : 'p-2.5'
              )}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-border bg-muted flex-shrink-0"
              />
              {!collapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};
