'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { User } from '../types/task';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (email?: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, load session from localStorage for sandbox mode
    if (!isFirebaseConfigured) {
      try {
        const storedUser = localStorage.getItem('task-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse mock user:', error);
      }
      setLoading(false);
      return;
    }

    // Live mode authentication listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          const isDemoAdmin = fbUser.email?.toLowerCase() === 'admin@test.com';
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userRole: 'admin' | 'user' = data.role || (isDemoAdmin ? 'admin' : 'user');
            setUser({
              id: fbUser.uid,
              name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || '',
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || fbUser.email?.split('@')[0] || 'User')}`,
              joinedDate: data.createdAt || new Date().toISOString(),
              role: userRole,
            });
          } else {
            const userRole: 'admin' | 'user' = isDemoAdmin ? 'admin' : 'user';
            const userProfile = {
              uid: fbUser.uid,
              name: isDemoAdmin ? 'Admin User' : (fbUser.displayName || fbUser.email?.split('@')[0] || 'User'),
              email: fbUser.email || '',
              role: userRole,
              createdAt: new Date().toISOString(),
            };
            
            await setDoc(userDocRef, userProfile);
            
            setUser({
              id: fbUser.uid,
              name: userProfile.name,
              email: userProfile.email,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`,
              joinedDate: userProfile.createdAt,
              role: userProfile.role,
            });
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || fbUser.email?.split('@')[0] || 'User')}`,
            joinedDate: new Date().toISOString(),
            role: fbUser.email?.toLowerCase() === 'admin@test.com' ? 'admin' : 'user',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Sandbox mode login
    if (!isFirebaseConfigured) {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (password.length < 6) {
            reject(new Error('Password must be at least 6 characters.'));
            return;
          }
          const isDemoAdmin = email.toLowerCase() === 'admin@test.com' && password === 'Admin@123';
          
          let mockProfile: User;
          if (isDemoAdmin) {
            mockProfile = {
              id: 'mock-admin-uid',
              name: 'Admin User',
              email: email,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent('Admin User')}`,
              joinedDate: new Date().toISOString(),
              role: 'admin',
            };
          } else {
            const sandboxUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
            const existingUser = sandboxUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
            
            if (existingUser) {
              mockProfile = {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                avatar: existingUser.avatar,
                joinedDate: existingUser.joinedDate || new Date().toISOString(),
                role: existingUser.role || 'user',
              };
            } else {
              mockProfile = {
                id: 'u-' + Math.random().toString(36).substring(2, 9),
                name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
                email: email,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0])}`,
                joinedDate: new Date().toISOString(),
                role: 'user',
              };
              sandboxUsers.push(mockProfile);
              localStorage.setItem('task-users-list', JSON.stringify(sandboxUsers));
            }
          }
          
          setUser(mockProfile);
          localStorage.setItem('task-user', JSON.stringify(mockProfile));
          setLoading(false);
          resolve();
        }, 650);
      });
    }

    // Live mode login
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    
    if (email.toLowerCase() === 'admin@test.com') {
      setLoading(false);
      throw new Error('This email address is reserved for administrative use.');
    }
    
    // Sandbox mode signup
    if (!isFirebaseConfigured) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const mockProfile: User = {
            id: 'u-' + Math.random().toString(36).substring(2, 9),
            name: name,
            email: email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            joinedDate: new Date().toISOString(),
            role: 'user',
          };
          
          const sandboxUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
          sandboxUsers.push(mockProfile);
          localStorage.setItem('task-users-list', JSON.stringify(sandboxUsers));
          
          setUser(mockProfile);
          localStorage.setItem('task-user', JSON.stringify(mockProfile));
          setLoading(false);
          resolve();
        }, 650);
      });
    }

    // Live mode signup
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userProfile = {
        uid: fbUser.uid,
        name: name,
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(userDocRef, userProfile);
      
      setUser({
        id: fbUser.uid,
        name: name,
        email: email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        joinedDate: userProfile.createdAt,
        role: 'user',
      });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    // Sandbox mode logout
    if (!isFirebaseConfigured) {
      setUser(null);
      localStorage.removeItem('task-user');
      setLoading(false);
      return;
    }

    // Live mode logout
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (email?: string, name?: string) => {
    setLoading(true);
    
    // Sandbox mode login
    if (!isFirebaseConfigured) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const finalEmail = email || 'demo@gmail.com';
          const finalName = name || 'Demo User';
          
          const mockProfile: User = {
            id: 'g-' + Math.random().toString(36).substring(2, 9),
            name: finalName,
            email: finalEmail,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`,
            joinedDate: new Date().toISOString(),
            role: finalEmail.toLowerCase() === 'admin@test.com' ? 'admin' : 'user',
          };
          
          const sandboxUsers = JSON.parse(localStorage.getItem('task-users-list') || '[]');
          const existingUser = sandboxUsers.find((u: any) => u.email.toLowerCase() === finalEmail.toLowerCase());
          
          if (!existingUser) {
            sandboxUsers.push(mockProfile);
            localStorage.setItem('task-users-list', JSON.stringify(sandboxUsers));
            setUser(mockProfile);
          } else {
            setUser({
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              avatar: existingUser.avatar,
              joinedDate: existingUser.joinedDate || new Date().toISOString(),
              role: existingUser.role || 'user',
            });
          }
          
          localStorage.setItem('task-user', JSON.stringify(mockProfile));
          setLoading(false);
          resolve();
        }, 650);
      });
    }

    // Live mode login
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      const isDemoAdmin = fbUser.email?.toLowerCase() === 'admin@test.com';
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userRole: 'admin' | 'user' = data.role || (isDemoAdmin ? 'admin' : 'user');
        setUser({
          id: fbUser.uid,
          name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User')}`,
          joinedDate: data.createdAt || new Date().toISOString(),
          role: userRole,
        });
      } else {
        const userRole: 'admin' | 'user' = isDemoAdmin ? 'admin' : 'user';
        const userProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          role: userRole,
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(userDocRef, userProfile);
        
        setUser({
          id: fbUser.uid,
          name: userProfile.name,
          email: userProfile.email,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile.name)}`,
          joinedDate: userProfile.createdAt,
          role: userProfile.role,
        });
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
