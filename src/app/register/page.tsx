'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { user, signUp } = useAuth();
  const { showToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!name.trim()) {
      tempErrors.name = 'Full name is required';
    }

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

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
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
      await signUp(name, email, password);
      showToast('Account registered successfully', 'success');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to create your account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'The email address is invalid.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'The password must be stronger.';
      }
      
      setErrors({ general: errorMsg });
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/35">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-8 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-350">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your Account</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Register today to track tasks and streamline productivity.
          </p>
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
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={submitting}
            autoFocus
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={submitting}
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

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            disabled={submitting}
          />

          <Button type="submit" className="w-full mt-2" isLoading={submitting}>
            Create Account <UserPlus size={16} className="ml-2" />
          </Button>
        </form>

        {/* Footer Redirect */}
        <div className="text-center text-xs text-muted-foreground mt-6 border-t border-border/60 pt-4 flex items-center justify-center gap-1.5">
          <Link href="/login" className="inline-flex items-center font-semibold text-primary hover:underline group">
            <ArrowLeft size={13} className="mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
