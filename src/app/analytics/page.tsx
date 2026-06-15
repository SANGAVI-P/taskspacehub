'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Calendar, BarChart3, Clock, ClipboardList } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AnalyticsPage() {
  const { tasks = [], logs = [] } = useApp();

  // Helper calculations for weekly stats
  const getWeeklyAnalytics = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dataMap = days.reduce((acc, day) => {
      acc[day] = { day, completed: 0, created: 0 };
      return acc;
    }, {} as Record<string, { day: string; completed: number; created: number }>);

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
        if (dataMap[dayName]) dataMap[dayName].created += 1;
      }
    });

    logs.forEach((log) => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      if (logDate >= monday && logDate <= sunday) {
        const isCompletion = 
          log.type === 'update' && 
          (log.action.includes('Marked Completed') || log.action.includes('Completed') || log.action.includes('status to completed'));
        
        if (isCompletion) {
          const dayIndex = (logDate.getDay() + 6) % 7;
          const dayName = days[dayIndex];
          if (dataMap[dayName]) {
            dataMap[dayName].completed += 1;
          }
        }
      }
    });

    // Fallback to count completed tasks from tasks list if they have no corresponding logs
    tasks.forEach((task) => {
      if (task.status === 'completed') {
        const hasLog = logs.some(l => 
          l.taskId === task.id && 
          l.type === 'update' && 
          (l.action.includes('Marked Completed') || l.action.includes('Completed') || l.action.includes('status to completed'))
        );
        if (!hasLog) {
          const dateToUse = new Date(task.lastUpdatedDate || task.dueDate || task.createdDate);
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

  const weeklyData = getWeeklyAnalytics();

  // Task Completion Trend (Cumulative completed tasks)
  const getCompletionTrend = () => {
    const data = [];
    let cumulativeCompletions = 0;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < days.length; i++) {
      cumulativeCompletions += weeklyData[i].completed;
      data.push({
        day: days[i],
        Completions: cumulativeCompletions
      });
    }
    return data;
  };

  const trendData = getCompletionTrend();

  // Task Priority Distribution
  const getPriorityData = () => {
    const counts = { low: 0, medium: 0, high: 0 };
    tasks.forEach(t => {
      if (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high') {
        counts[t.priority] += 1;
      }
    });
    return [
      { name: 'Low Priority', count: counts.low, fill: '#3B82F6' },
      { name: 'Medium Priority', count: counts.medium, fill: '#F59E0B' },
      { name: 'High Priority', count: counts.high, fill: '#EF4444' }
    ];
  };

  const priorityData = getPriorityData();

  // Activity Heatmap (Grid cells representing last 30 days)
  const getHeatmapData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Find activity in tasks or logs on this date
      let activityCount = 0;
      tasks.forEach((t) => {
        if (t.createdDate?.split('T')[0] === dateString) activityCount += 1;
        if (t.lastUpdatedDate?.split('T')[0] === dateString && t.status === 'completed') activityCount += 2;
      });

      logs.forEach((l) => {
        if (l.timestamp?.split('T')[0] === dateString) activityCount += 0.5;
      });

      data.push({
        date: dateString,
        dayNum: date.getDate(),
        month: date.toLocaleDateString([], { month: 'short' }),
        count: Math.ceil(activityCount),
      });
    }
    return data;
  };

  const heatmapData = getHeatmapData();

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed metrics charting completion rates, priority distribution, and developer velocity feeds.
        </p>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Weekly Productivity Chart */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={16} className="text-[#7C5CFF]" /> Weekly Productivity Velocity
            </h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Created vs Completed</span>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletedAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorCreatedAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area name="Tasks Created" type="monotone" dataKey="created" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorCreatedAnalytics)" />
                <Area name="Tasks Completed" type="monotone" dataKey="completed" stroke="#7C5CFF" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCompletedAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Task Priority Distribution */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ClipboardList size={16} className="text-sky-600 dark:text-sky-400" /> Priority Distribution
            </h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Task Priorities</span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }} />
                <Bar name="Count" dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Task Completion Trend */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" /> Task Completion Trendline
            </h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Weekly cumulative</span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }} />
                <Area name="Cumulative Completed" type="monotone" dataKey="Completions" stroke="#7C5CFF" strokeWidth={1.5} fillOpacity={1} fill="url(#purpleWave)" activeDot={{ r: 5 }} dot={{ strokeWidth: 1.5, r: 2.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Activity Heatmap Container */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-[#7C5CFF]" /> Workspace Activity Heatmap
            </h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Last 30 Days</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-normal">
              Visualizes daily updates, task submissions, creations, and milestones logged in active buffers.
            </p>
            
            {/* Heatmap Grid Cells */}
            <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-secondary/30 p-4 rounded-xl border border-border">
              {heatmapData.map((day, idx) => {
                let cellColor = 'bg-secondary/40 border border-border/40'; // 0 count
                if (day.count === 1) cellColor = 'bg-[#7C5CFF]/20 border border-[#7C5CFF]/30';
                else if (day.count === 2) cellColor = 'bg-[#7C5CFF]/45 border border-[#7C5CFF]/50';
                else if (day.count >= 3) cellColor = 'bg-[#7C5CFF] text-white';

                return (
                  <div
                    key={idx}
                    className={`h-7 w-7 rounded flex items-center justify-center text-[9px] font-black cursor-pointer hover:ring-1 hover:ring-[#7C5CFF] transition-all ${cellColor}`}
                    title={`${day.month} ${day.dayNum}: ${day.count} workspace actions`}
                  >
                    {day.dayNum}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground font-bold">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3.5 w-3.5 rounded bg-secondary/40 border border-border/40" />
                <div className="h-3.5 w-3.5 rounded bg-[#7C5CFF]/20 border border-[#7C5CFF]/30" />
                <div className="h-3.5 w-3.5 rounded bg-[#7C5CFF]/45 border border-[#7C5CFF]/50" />
                <div className="h-3.5 w-3.5 rounded bg-[#7C5CFF]" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
