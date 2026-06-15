'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { isFirebaseConfigured } from '../../lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signInWithGoogle } = useAuth();
  const { showToast } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Google Sign-In states
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
        const defaultAccounts = [
          { name: 'Sanga User', email: 'sanga@gmail.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sanga%20User' },
          { name: 'Admin User', email: 'admin@test.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin%20User' },
          { name: 'Demo User', email: 'demo@taskspacehub.com', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo%20User' }
        ];
        
        const combined = [...storedUsers];
        defaultAccounts.forEach(def => {
          if (!combined.some(u => u.email.toLowerCase() === def.email.toLowerCase())) {
            combined.push(def);
          }
        });
        
        setGoogleAccounts(combined);
      } catch (e) {
        console.error('Failed to load registered accounts:', e);
      }
    }
  }, []);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    
    try {
      await signIn(email, password);
      showToast('Logged in successfully', 'success');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Invalid email or password. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect credentials. Please verify and try again.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid login credentials. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Access has been temporarily restricted. Please try again later.';
      }
      
      setErrors({ general: errorMsg });
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    if (isFirebaseConfigured) {
      setGoogleSubmitting(true);
      try {
        await signInWithGoogle();
        showToast('Logged in successfully with Google', 'success');
        router.push('/');
      } catch (err: any) {
        console.error(err);
        showToast(err.message || 'Google Sign-In failed', 'error');
      } finally {
        setGoogleSubmitting(false);
      }
    }
  };

  const handleSelectGoogleAccount = async (email: string, name?: string) => {
    if (!email) {
      showToast('Please provide a Google email', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid Google email address', 'error');
      return;
    }

    setGoogleSubmitting(true);
    try {
      const finalName = name || email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
      await signInWithGoogle(email, finalName);
      
      showToast(`Logged in successfully as ${finalName}`, 'success');
      setShowCustomGoogle(false);
      setCustomGoogleEmail('');
      setCustomGoogleName('');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Google Sign-In failed', 'error');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/35">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-8 relative z-10 flex flex-col justify-between">
        <div>
          {/* Header Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome to TASK SPACE HUB</h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
              Enter your credentials below to access your collaborative team workspace.
            </p>
          </div>

          {/* Demo Credentials Tip */}
          <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 mb-6 text-xs text-muted-foreground flex gap-2.5 items-start">
            <ShieldCheck size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-foreground block mb-0.5">Quick Demo Tip</span>
              Use any email (e.g. <code className="text-indigo-400">demo@taskspacehub.com</code>) and any password (min. 6 characters) to log in immediately.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl p-3 flex gap-2 items-center">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={submitting}
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={submitting}
            />

            <Button type="submit" className="w-full mt-2" isLoading={submitting}>
              Log In <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>


        </div>

        {/* Footer Redirect */}
        <div className="text-center text-xs text-muted-foreground mt-6 border-t border-border/60 pt-4">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
