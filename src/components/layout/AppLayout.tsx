'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Loader } from '../ui/Loader';
import { ToastContainer } from '../ui/Toast';
import { Gift, Trophy, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    user, 
    loading, 
    showGiftBox, 
    setShowGiftBox, 
    activeMilestone, 
    showRewardModal, 
    setShowRewardModal 
  } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        router.replace('/login');
      } else if (user && isAdminRoute && user.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, isAuthPage, isAdminRoute, router]);

  // While checking auth, show loading state for protected pages
  if (loading && !isAuthPage) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader size="lg" className="mb-4" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
          Loading your workspace...
        </p>
      </div>
    );
  }

  // Redirecting...
  if (!user && !isAuthPage) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background" />
    );
  }

  // Redirecting unauthorized users from admin route
  if (user && isAdminRoute && user.role !== 'admin') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader size="lg" className="mb-4" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
          Unauthorized. Redirecting to dashboard...
        </p>
      </div>
    );
  }

  // Render raw layout for Auth pages
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <ToastContainer />
      </div>
    );
  }

  // Dashboard / App layout for authenticated users
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Navbar */}
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Content Wrapper */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Floating Gift Box for Milestone achievements */}
      <AnimatePresence>
        {showGiftBox && (
          <motion.div
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: 'spring', damping: 15 }
            }}
            exit={{ scale: 0, y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <motion.button
              onClick={() => {
                setShowRewardModal(true);
                setShowGiftBox(false);
              }}
              animate={{
                y: [0, -10, 0],
                rotate: [0, -5, 5, -5, 5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut"
              }}
              className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border-2 border-purple-400 text-white flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer relative"
              title="You reached a milestone! Click to claim reward"
            >
              <Gift size={26} />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full border border-card flex items-center justify-center text-[9px] font-black text-white">!</span>
              <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-50" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRewardModal(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 md:p-8 z-10 flex flex-col items-center text-center text-foreground"
            >
              {/* Floating sparkles background */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#7C5CFF] to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setShowRewardModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>

              {/* Icon */}
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg border border-yellow-300 mb-5 text-white">
                <Trophy size={30} />
              </div>

              {/* Reward Modal Content */}
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                Milestone reached: {activeMilestone} Completed Tasks!
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Great job! You completed another milestone. Keep the momentum going.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 order-2 sm:order-1"
                  onClick={() => setShowRewardModal(false)}
                >
                  Continue
                </Button>
                <Button
                  className="flex-1 text-xs h-10 bg-[#7C5CFF] text-white hover:bg-[#6c4be0] order-1 sm:order-2"
                  onClick={() => {
                    setShowRewardModal(false);
                    router.push('/profile');
                  }}
                >
                  View Progress
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
