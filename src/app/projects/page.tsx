'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Users, ArrowUpRight, CheckSquare, Sparkles, FolderOpen, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  teamSize: number;
  tasksCount: number;
  category: string;
  projectUrl?: string;
}

export default function ProjectsPage() {
  const { showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectUrl, setProjectUrl] = useState('');

  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('task-projects');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    const newProject: Project = {
      id: 'p' + (projects.length + 1),
      name: projectName,
      description: projectDesc || 'No description provided.',
      progress: 0,
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      teamSize: 1,
      tasksCount: 0,
      category: 'General Workspace',
      projectUrl: projectUrl.trim() || undefined,
    };

    const nextProjects = [newProject, ...projects];
    setProjects(nextProjects);
    localStorage.setItem('task-projects', JSON.stringify(nextProjects));
    setProjectName('');
    setProjectDesc('');
    setProjectUrl('');
    setIsModalOpen(false);
    showToast(`Project "${projectName}" created successfully!`, 'success');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22, stiffness: 150 } },
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Workspace Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group, organize, and monitor execution progress across distinct roadmap areas.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="w-fit">
          <Plus size={16} className="mr-1.5" /> Create Project
        </Button>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-350">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Projects</span>
            <FolderOpen size={16} className="text-primary" />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">{projects.length}</span>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+1 new</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-350">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
            <CheckSquare size={16} className="text-emerald-500" />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
            </span>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Optimal</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-350">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Tasks</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">
              {projects.reduce((acc, p) => acc + p.tasksCount, 0)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Across board</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-350">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Integrations</span>
            <Sparkles size={16} className="text-accent" />
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-black text-foreground">2 Active</span>
            <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Habitica API</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-4 bg-card border border-border rounded-2xl shadow-sm">
          <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-muted-foreground">
            <FolderOpen size={32} />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-sm font-bold text-foreground">🚀 Create Your First Project</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Organize your roadmap items. Group related tasks together to calculate group velocity indexes.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="mt-4 text-xs">
              + Add Project
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-card border border-border hover:border-primary/45 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative group select-none transition-all duration-300"
            >
              {/* Subtle glow border */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div>
                {/* Optional Project Image Header */}
                {project.projectUrl && (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(project.projectUrl) || project.projectUrl.startsWith('data:image/')) && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-4 border border-border/50 bg-secondary/35">
                    <img
                      src={project.projectUrl}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Category & Badge header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold bg-secondary/50 px-2 py-1 rounded border border-border/40">
                    {project.category}
                  </span>
                  <Badge variant={project.priority === 'high' ? 'high' : 'medium'}>
                    {project.priority} priority
                  </Badge>
                </div>

                {/* Title & description */}
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span className="truncate pr-2">{project.name}</span>
                  {project.projectUrl ? (
                    <a href={project.projectUrl} target="_blank" rel="noreferrer" className="text-primary hover:text-accent flex items-center gap-1 z-10 shrink-0">
                      <ArrowUpRight size={15} />
                    </a>
                  ) : (
                    <ArrowUpRight size={15} className="opacity-0 group-hover:opacity-100 transition-all text-primary translate-x-1" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed min-h-[50px]">
                  {project.description}
                </p>
              </div>

              {/* Bottom statistics & Progress slider */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Progress</span>
                    <span className="font-extrabold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/10">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/40 pt-3 text-[10px] text-muted-foreground font-bold">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {project.teamSize} Member{project.teamSize > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare size={12} /> {project.tasksCount} Tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Due {new Date(project.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Project Creation Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workspace Project"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Analytics Engine"
            value={projectName}
            onChange={(e) => setProjectName(e.currentTarget.value)}
            autoFocus
          />
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Description</label>
            <textarea
              placeholder="Provide context about goals, scope, and key deliverables..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full min-h-[80px] p-3 bg-secondary border border-border text-sm text-foreground rounded-lg transition-all focus:outline-none focus:border-primary placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary"
            />
          </div>
          <Input
            label="Project URL / Reference (Image or Link)"
            placeholder="https://example.com/project-spec.pdf or screenshot.png"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
