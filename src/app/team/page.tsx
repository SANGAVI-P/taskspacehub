'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, CheckCircle2, Trash2, FolderKanban, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { taskService } from '../../services/taskService';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'editor' | 'viewer';
  tasksAssigned: number;
  tasksCompleted: number;
  status: 'online' | 'offline';
}

export default function TeamPage() {
  const { tasks, user, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  useEffect(() => {
    // Load projects count
    if (typeof window !== 'undefined') {
      const savedProjs = localStorage.getItem('task-projects');
      if (savedProjs) {
        try {
          const parsed = JSON.parse(savedProjs);
          setActiveProjectsCount(parsed.length);
        } catch (e) {
          setActiveProjectsCount(0);
        }
      } else {
        setActiveProjectsCount(0);
      }
    }
  }, [tasks]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        let invitedEmails: string[] = [];
        if (!isFirebaseConfigured) {
          const saved = localStorage.getItem(`task-invited-emails-${user?.id}`);
          invitedEmails = saved ? JSON.parse(saved) : [];
        } else if (user) {
          const userDocRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userDocRef);
          invitedEmails = userDoc.exists() ? (userDoc.data().invitedEmails || []) : [];
        }

        const uList = await taskService.fetchAllUsers();
        // Filter users to display only the logged-in user themselves or those explicitly invited
        const filteredUsers = uList.filter(u => {
          const uEmail = (u.email || '').toLowerCase();
          const uUid = u.uid || u.id;
          const isCurrentUser = user && (uUid === user.id || uEmail === user.email?.toLowerCase());
          return isCurrentUser || invitedEmails.includes(uEmail);
        });

        const mappedList: TeamMember[] = filteredUsers.map((u, idx) => {
          const userId = u.uid || u.id;
          const assigned = tasks.filter(t => t.assignee?.id === userId);
          const completed = assigned.filter(t => t.status === 'completed');
          
          return {
            id: userId,
            name: u.name || 'Collaborator',
            email: u.email || '',
            avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'User')}`,
            role: (u.role as 'admin' | 'editor' | 'viewer') || 'editor',
            tasksAssigned: assigned.length,
            tasksCompleted: completed.length,
            status: idx % 2 === 0 ? 'online' : 'offline',
          };
        });
        setMembers(mappedList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, [tasks, user]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast('Email address is required', 'error');
      return;
    }

    try {
      // 1. Verify email registration in database users collection
      const registeredUser = await taskService.getUserByEmail(inviteEmail);
      if (!registeredUser) {
        showToast('User not found. Ask them to create an account first.', 'error');
        return;
      }

      // 2. Persist invite connection in database
      if (user) {
        await taskService.addInvitedEmail(user.id, inviteEmail);
      }

      // 3. Immediately map card attributes for list state display without page refresh
      const userId = registeredUser.uid || registeredUser.id;
      const assigned = tasks.filter(t => t.assignee?.id === userId);
      const completed = assigned.filter(t => t.status === 'completed');

      const newMember: TeamMember = {
        id: userId,
        name: registeredUser.name || 'Collaborator',
        email: registeredUser.email || inviteEmail,
        avatar: registeredUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(registeredUser.name || 'User')}`,
        role: registeredUser.role || 'editor',
        tasksAssigned: assigned.length,
        tasksCompleted: completed.length,
        status: 'offline',
      };

      setMembers(prev => {
        if (prev.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
          return prev;
        }
        return [...prev, newMember];
      });

      setInviteEmail('');
      setIsModalOpen(false);
      showToast('Member added successfully.', 'success');
    } catch (error) {
      showToast('Failed to invite team member', 'error');
    }
  };

  const handleDelete = (id: string) => {
    // Also remove from localStorage/invitedEmails if necessary, but simple local filter is fine for sandbox portfolio delete
    setMembers(members.filter(m => m.id !== id));
    showToast('Team member removed from workspace', 'info');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, damping: 20 } },
  };

  const pendingTasksCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'expired'
  ).length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Workspace Collaborators
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite team members, assign task responsibilities, and coordinate execution.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="w-fit bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
          <Plus size={16} className="mr-1.5" /> Invite Member
        </Button>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Total Members</span>
            <span className="text-2xl font-black text-foreground block mt-0.5">{members.length} Members</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
            <FolderKanban size={24} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Active Projects</span>
            <span className="text-2xl font-black text-foreground block mt-0.5">
              {activeProjectsCount} Projects
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Pending Tasks</span>
            <span className="text-2xl font-black text-foreground block mt-0.5">
              {pendingTasksCount} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {members.map((member) => (
          <motion.div
            key={member.id}
            variants={cardVariants}
            className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group select-none shadow-md hover:border-primary/20 dark:hover:border-slate-700 transition-all duration-300"
          >
            {/* Status indicator bar */}
            <span className={`absolute top-0 left-0 right-0 h-1 ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-700'}`} />

            <div className="flex flex-col items-center text-center mt-3 w-full min-w-0">
              {/* Profile Avatar */}
              <div className="relative mb-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="h-20 w-20 rounded-full border border-slate-200 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-800"
                />
                <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>

              {/* Name & Credentials */}
              <h3 className="text-base font-bold text-foreground truncate max-w-full w-full">{member.name}</h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-full w-full">{member.email}</p>
              
              <div className="flex gap-1.5 mt-2.5">
                <Badge variant={member.role === 'admin' ? 'high' : 'medium'} className="text-[9px] uppercase tracking-wide px-2 py-0.5">
                  {member.role}
                </Badge>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mt-6 pt-5 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-secondary/40 border border-border/80 p-2 rounded-xl">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Assigned</span>
                  <span className="text-sm font-black text-foreground">{member.tasksAssigned}</span>
                </div>
                <div className="bg-secondary/40 border border-border/80 p-2 rounded-xl">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Completed</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{member.tasksCompleted}</span>
                </div>
              </div>
            </div>

            {/* Action Row */}
            {member.id !== user?.id && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(member.id)}
                  className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                  title="Remove collaborator"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Team Invitation Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Workspace Member"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            placeholder="e.g. elena@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.currentTarget.value)}
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button size="sm" onClick={handleInvite} className="bg-[#7C5CFF] text-white hover:bg-[#6c4be0]">
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
