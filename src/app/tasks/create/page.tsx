'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { TaskForm } from '../../../components/tasks/TaskForm';
import { Button } from '../../../components/ui/Button';

export default function CreateTaskPage() {
  const router = useRouter();
  const { createTask } = useApp();

  const handleSubmit = (data: any) => {
    createTask(data);
    router.push('/tasks');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2">
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Back to tasks
        </span>
      </div>

      <div className="space-y-1 border-b border-border/60 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white flex items-center gap-2">
          <PlusCircle className="text-primary" size={28} /> Create Task
        </h1>
        <p className="text-sm text-muted-foreground">
          Outline requirements, set due dates, and build checklists for your new project scope.
        </p>
      </div>

      {/* Task Form container */}
      <div className="bg-card border border-border p-6 rounded-2xl max-w-3xl">
        <TaskForm onSubmit={handleSubmit} submitButtonText="Create Task" />
      </div>
    </div>
  );
}
