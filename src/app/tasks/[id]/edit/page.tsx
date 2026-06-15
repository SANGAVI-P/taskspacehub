'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '../../../../context/AppContext';
import { TaskForm } from '../../../../components/tasks/TaskForm';
import { Button } from '../../../../components/ui/Button';
import { Task } from '../../../../types/task';
import { Loader } from '../../../../components/ui/Loader';

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { tasks, updateTask, loading, tasksLoading } = useApp();
  
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && !tasksLoading) {
      const foundTask = tasks.find((t) => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
  }, [id, tasks, loading, tasksLoading]);

  const handleSubmit = (data: any) => {
    updateTask(id, data);
    router.push('/tasks');
  };

  if (loading || tasksLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader size="md" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-border rounded-2xl max-w-md mx-auto mt-10">
        <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">Task Not Found</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The task you are trying to edit does not exist or has been deleted from this workspace.
        </p>
        <Link href="/tasks">
          <Button variant="secondary" size="sm">
            Back to tasks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
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
          <Edit3 className="text-primary" size={26} /> Edit Task
        </h1>
        <p className="text-sm text-muted-foreground">
          Modify the title, status, priority, or checkbox list items for this workspace roadmap.
        </p>
      </div>

      {/* Task Form container */}
      <div className="bg-card border border-border p-6 rounded-2xl max-w-3xl">
        {task && (
          <TaskForm
            initialData={task}
            onSubmit={handleSubmit}
            submitButtonText="Save Changes"
          />
        )}
      </div>
    </div>
  );
}
