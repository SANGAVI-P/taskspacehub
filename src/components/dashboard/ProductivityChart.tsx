'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, ActivityLog } from '../../types/task';

interface ChartDataPoint {
  day: string;
  completed: number;
  created: number;
}

interface ProductivityChartProps {
  tasks: Task[];
  logs: ActivityLog[];
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ tasks = [], logs = [] }) => {
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const dataMap = days.reduce((acc, day) => {
      acc[day] = { day, completed: 0, created: 0 };
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    tasks.forEach((task) => {
      if (!task.createdDate) return;
      const created = new Date(task.createdDate);
      if (created >= monday && created <= sunday) {
        const dayIndex = (created.getDay() + 6) % 7;
        const dayName = days[dayIndex];
        if (dataMap[dayName]) {
          dataMap[dayName].created += 1;
        }
      }
    });

    logs.forEach((log) => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      if (logDate >= monday && logDate <= sunday) {
        const isCompletion = 
          log.type === 'update' && 
          (log.action.includes('to "completed"') || 
           (log.action.includes('changed status') && log.action.includes('completed')));
        
        if (isCompletion) {
          const dayIndex = (logDate.getDay() + 6) % 7;
          const dayName = days[dayIndex];
          if (dataMap[dayName]) {
            dataMap[dayName].completed += 1;
          }
        }
      }
    });

    tasks.forEach((task) => {
      if (task.status === 'completed') {
        const hasLog = logs.some(l => 
          l.taskId === task.id && 
          l.type === 'update' && 
          (l.action.includes('to "completed"') || l.action.includes('completed'))
        );
        if (!hasLog) {
          const dateToUse = new Date(task.dueDate || task.createdDate);
          if (dateToUse >= monday && dateToUse <= sunday) {
            const dayIndex = (dateToUse.getDay() + 6) % 7;
            const dayName = days[dayIndex];
            if (dataMap[dayName]) {
              dataMap[dayName].completed += 1;
            }
          }
        }
      }
    });

    return Object.values(dataMap);
  };

  const chartData = getWeeklyData();

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis 
            dataKey="day" 
            stroke="var(--muted-foreground)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px'
            }}
          />
          <Area 
            name="Tasks Completed"
            type="monotone" 
            dataKey="completed" 
            stroke="var(--primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCompleted)" 
          />
          <Area 
            name="Tasks Created"
            type="monotone" 
            dataKey="created" 
            stroke="#94a3b8" 
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1} 
            fill="url(#colorCreated)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
