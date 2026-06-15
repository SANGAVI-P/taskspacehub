'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (googleModalOpen && typeof window !== 'undefined') {
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
  }, [googleModalOpen]);

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
    } else {
      setGoogleModalOpen(true);
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
      setGoogleModalOpen(false);
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

      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-8 relative z-10">
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

        <div className="relative flex items-center justify-center my-5">
          <span className="absolute px-3 bg-card text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">or</span>
          <div className="w-full border-t border-border/60" />
        </div>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full font-bold flex items-center justify-center gap-2 border-border/70 hover:bg-secondary/50 h-10 cursor-pointer select-none"
          onClick={handleGoogleClick}
          disabled={submitting || googleSubmitting}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.71 14.94 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.26 7.53 8.91 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.67-2.33 3.5l3.61 2.8c2.12-1.95 3.78-4.83 3.78-8.45z"
            />
            <path
              fill="#FBBC05"
              d="M5.36 14.5c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.5 7.1C.54 9.03 0 11.18 0 13.5s.54 4.47 1.5 6.4l3.86-3.4z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.9l-3.61-2.8c-1.2.8-2.73 1.28-4.35 1.28-3.09 0-5.74-2.49-6.64-5.46L1.5 16.5C3.39 20.35 7.35 23 12 23z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Footer Redirect */}
        <div className="text-center text-xs text-muted-foreground mt-6 border-t border-border/60 pt-4">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>

      <Modal
        isOpen={googleModalOpen}
        onClose={() => {
          setGoogleModalOpen(false);
          setShowCustomGoogle(false);
          setCustomGoogleEmail('');
          setCustomGoogleName('');
        }}
        title="Sign in with Google"
        size="sm"
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.71 14.94 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.26 7.53 8.91 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.67-2.33 3.5l3.61 2.8c2.12-1.95 3.78-4.83 3.78-8.45z"
              />
              <path
                fill="#FBBC05"
                d="M5.36 14.5c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.5 7.1C.54 9.03 0 11.18 0 13.5s.54 4.47 1.5 6.4l3.86-3.4z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.9l-3.61-2.8c-1.2.8-2.73 1.28-4.35 1.28-3.09 0-5.74-2.49-6.64-5.46L1.5 16.5C3.39 20.35 7.35 23 12 23z"
              />
            </svg>
            <span className="font-bold text-lg tracking-tight">Google</span>
          </div>

          {!showCustomGoogle ? (
            <div className="w-full space-y-4 text-left">
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground">Choose an account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">to continue to TASK SPACE HUB</p>
              </div>

              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-secondary/10">
                {googleAccounts.map((account) => (
                  <button
                    type="button"
                    key={account.email}
                    onClick={() => handleSelectGoogleAccount(account.email, account.name)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors cursor-pointer text-left focus:outline-none"
                    disabled={googleSubmitting}
                  >
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="h-8 w-8 rounded-full border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{account.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{account.email}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCustomGoogle(true)}
                className="w-full py-2.5 text-xs font-bold text-primary hover:bg-secondary/40 border border-dashed border-border/80 rounded-xl transition-colors cursor-pointer text-center focus:outline-none"
                disabled={googleSubmitting}
              >
                Use another account
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4 text-left">
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground">Sign in with Google</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Enter custom Google account details</p>
              </div>

              <div className="space-y-3">
                <Input
                  label="Name"
                  placeholder="John Doe"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  disabled={googleSubmitting}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  disabled={googleSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setShowCustomGoogle(false);
                    setCustomGoogleEmail('');
                    setCustomGoogleName('');
                  }}
                  disabled={googleSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleSelectGoogleAccount(customGoogleEmail, customGoogleName)}
                  isLoading={googleSubmitting}
                  disabled={!customGoogleEmail || !customGoogleName}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
            To continue, Google will share your name, email address, language preference, and profile picture with TASK SPACE HUB.
          </p>
        </div>
      </Modal>
    </div>
  );
}
