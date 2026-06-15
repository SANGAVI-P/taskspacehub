'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Tags, CheckSquare } from 'lucide-react';
import { Task, Priority, TaskStatus, SubTask } from '../../types/task';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { taskService } from '../../services/taskService';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Omit<Task, 'id' | 'createdDate'>) => void;
  submitButtonText: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('initiated');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [usersList, setUsersList] = useState<any[]>([]);

  // Load workspace users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await taskService.fetchAllUsers();
        setUsersList(list);
      } catch (error) {
        console.error('Failed to load users for assignment:', error);
      }
    };
    fetchUsers();
  }, []);

  // Populate form if initialData exists (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setStatus(initialData.status);
      setPriority(initialData.priority);
      const formattedDate = initialData.dueDate ? initialData.dueDate.split('T')[0] : '';
      setDueDate(formattedDate);
      setTagsInput((initialData.tags || []).join(', '));
      setSubtasks(initialData.subtasks || []);
      setAssigneeId(initialData.assignee?.id || '');
      setTaskUrl(initialData.taskUrl || '');
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setStatus('initiated');
      setAssigneeId('');
      setTaskUrl('');
    }
  }, [initialData]);

  const handleAssigneeChange = (val: string) => {
    setAssigneeId(val);
    if (val && status === 'initiated') {
      setStatus('assigned');
    } else if (!val && status === 'assigned') {
      setStatus('initiated');
    }
  };

  // Validation
  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!title.trim()) {
      tempErrors.title = 'Task title is required';
    }
    if (!description.trim()) {
      tempErrors.description = 'Task description is required';
    }
    if (!dueDate) {
      tempErrors.dueDate = 'Due date is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedUser = usersList.find(u => (u.uid || u.id) === assigneeId);
    let assigneeObj = undefined;
    if (selectedUser) {
      assigneeObj = {
        id: selectedUser.uid || selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        avatar: selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.name)}`,
        joinedDate: selectedUser.joinedDate || selectedUser.createdAt || new Date().toISOString(),
        role: selectedUser.role || 'user',
      };
    }

    const processedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    onSubmit({
      title,
      description,
      status,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      tags: processedTags,
      subtasks,
      assignee: assigneeObj,
      progressPercent: initialData ? initialData.progressPercent : 0,
      taskUrl: taskUrl.trim() || undefined,
    });
  };

  // Subtask Actions
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: 'st-' + Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title input */}
      <Input
        label="Task Title"
        placeholder="Enter a descriptive title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      {/* Description input */}
      <div className="flex flex-col space-y-1">
        <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Description
        </label>
        <textarea
          placeholder="Provide detail on requirements, parameters, or outcomes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 bg-secondary border border-border text-sm text-foreground rounded-lg transition-all duration-200 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] ${
            errors.description && 'border-destructive focus:border-destructive'
          }`}
        />
        {errors.description && (
          <span className="text-xs text-destructive font-medium">{errors.description}</span>
        )}
      </div>

      {/* Grid: Status, Assignee, Priority, Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Status Dropdown */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Status
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="h-11 md:h-10 w-full pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="initiated">Initiated</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="submission-pending">Submission Pending</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
          </div>
        </div>

        {/* Assigned User Dropdown */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Assignee
          </label>
          <div className="relative">
            <select
              value={assigneeId}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="h-11 md:h-10 w-full pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Unassigned</option>
              {usersList.map((u) => (
                <option key={u.uid || u.id} value={u.uid || u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
          </div>
        </div>

        {/* Priority */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Priority
          </label>
          <div className="relative">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="h-11 md:h-10 w-full pl-3 pr-8 bg-secondary border border-border text-sm text-foreground rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div className="absolute right-3 top-4 md:top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground" />
          </div>
        </div>

        {/* Due Date Picker */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase flex items-center">
            <Calendar size={12} className="mr-1" /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`h-11 md:h-10 px-3 bg-secondary border border-border text-sm text-foreground rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
              errors.dueDate && 'border-destructive'
            }`}
          />
          {errors.dueDate && (
            <span className="text-xs text-destructive font-medium">{errors.dueDate}</span>
          )}
        </div>
      </div>

      {/* Tags Comma Input */}
      <Input
        label="Tags (comma separated)"
        placeholder="Design, Figma, Frontend, etc."
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        helperText="Separate multiple categories with commas"
      />

      {/* Task URL (Image or Link) Input */}
      <Input
        label="Task URL / Reference (Link or Image)"
        placeholder="https://example.com/reference-asset.png or any link"
        value={taskUrl}
        onChange={(e) => setTaskUrl(e.target.value)}
        helperText="Provide an optional reference link or image preview for the task requirements"
      />

      {/* Subtasks Checklist Builder */}
      <div className="border-t border-border/60 pt-6 space-y-3">
        <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase flex items-center">
          <CheckSquare size={13} className="mr-1" /> Subtask Checklist
        </label>
        
        {/* Subtask Input row */}
        <div className="flex gap-2.5">
          <input
            type="text"
            placeholder="Add subtask details..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            className="flex-1 h-11 md:h-9 px-3 bg-secondary/60 border border-border text-xs text-foreground rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-secondary"
          />
          <Button type="button" onClick={addSubtask} variant="secondary" size="sm" className="h-11 md:h-9 shrink-0">
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>

        {/* Subtasks List */}
        {subtasks.length > 0 && (
          <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 space-y-2 max-h-48 overflow-y-auto">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => toggleSubtask(st.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
                  />
                  <span className={`text-foreground truncate font-medium ${st.completed && 'line-through text-muted-foreground'}`}>
                    {st.title}
                  </span>
                </label>
                
                <button
                  type="button"
                  onClick={() => removeSubtask(st.id)}
                  className="text-muted-foreground hover:text-rose-500 cursor-pointer focus:outline-none"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Submit Buttons */}
      <div className="flex justify-end pt-4 border-t border-border/60">
        <Button type="submit">
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
};
