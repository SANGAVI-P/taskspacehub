'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, Moon, Sun, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { isFirebaseConfigured } from '../../lib/firebase';

export default function SettingsPage() {
  const { theme, toggleTheme, showToast } = useApp();
  
  // Notification presets states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(true);
  
  // Workspace properties
  const [workspaceName, setWorkspaceName] = useState('TASK SPACE HUB Workspace');

  const handleSaveSettings = () => {
    showToast('Settings saved successfully', 'success');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize workspace parameters, theme settings, and alert priorities.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
            <Moon size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Aesthetic Theme</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Workspace Theme Mode</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Toggle between light and dark mode classes for optimal screen luminosity.
              </p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 h-11 md:h-9 px-4 bg-secondary border border-border hover:bg-secondary/90 text-xs font-bold rounded-lg transition-colors cursor-pointer focus:outline-none"
            >
              {theme === 'dark' ? (
                <>
                  <Moon size={14} className="text-indigo-400" /> Dark Mode
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-500" /> Light Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace Configurations */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">General Workspace Properties</h3>
          </div>

          <div className="space-y-3 max-w-md">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace Title</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full h-11 md:h-9 px-3 bg-secondary border border-border text-xs text-foreground rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Notification alerts toggles */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
            <Bell size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Alert Toggles</h3>
          </div>

          <div className="space-y-3.5 divide-y divide-border/40">
            {/* Email alerts */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-bold text-foreground">Email Notifications</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Receive digests of due dates and milestone achievements.</p>
              </div>
              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              >
                {emailAlerts ? (
                  <ToggleRight size={28} className="text-primary" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>

            {/* Push alerts */}
            <div className="flex items-center justify-between pt-3.5">
              <div>
                <p className="text-xs font-bold text-foreground">Real-time Browser Push Alerts</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Receive desktop toast indicators when tasks undergo changes.</p>
              </div>
              <button
                onClick={() => setPushAlerts(!pushAlerts)}
                className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              >
                {pushAlerts ? (
                  <ToggleRight size={28} className="text-primary" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>

            {/* Slack alerts */}
            <div className="flex items-center justify-between pt-3.5">
              <div>
                <p className="text-xs font-bold text-foreground">Workspace Integration Webhooks</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Publish activity details directly into designated team chat loops.</p>
              </div>
              <button
                onClick={() => setSlackAlerts(!slackAlerts)}
                className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              >
                {slackAlerts ? (
                  <ToggleRight size={28} className="text-primary" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security / Deployment */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
            <Shield size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Platform Integrations</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Database Sync Status</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isFirebaseConfigured
                  ? "Workspace is synced to live Google Cloud Firebase and Cloud Firestore databases."
                  : "Workspace is running in Sandbox fallback mode. Configure valid API keys inside .env.local to activate Firebase."}
              </p>
            </div>
            {isFirebaseConfigured ? (
              <Badge variant="completed">Live Database</Badge>
            ) : (
              <Badge variant="medium">Sandbox Mode</Badge>
            )}
          </div>
        </div>

        {/* Form Submission */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
