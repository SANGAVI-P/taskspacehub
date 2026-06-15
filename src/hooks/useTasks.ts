import { useApp } from '../context/AppContext';

export const useTasks = () => {
  const { tasks, tasksLoading, createTask, updateTask, deleteTask } = useApp();
  
  return {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};

export default useTasks;
