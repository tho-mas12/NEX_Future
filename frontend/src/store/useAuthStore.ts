import { create } from 'zustand';
import { apiRequest } from '@/lib/api';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';
export type TargetExam = 'CGL' | 'CHSL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  target_exam?: TargetExam | null;
  exam_date?: string | null;
  current_stage?: number;
  streak_count: number;
  onboarding_completed: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('examrail_token'),
  isAuthenticated: !!localStorage.getItem('examrail_token'),
  isLoading: true,
  isFirebaseActive: isFirebaseConfigured,

  login: async (email: string, password: string) => {
    // If Firebase is configured with active credentials, authenticate with Firebase
    if (isFirebaseConfigured) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        const idToken = await fbUser.getIdToken();

        // Retrieve server-verified role and profile from Cloud Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let role: UserRole = 'user';
        let onboarding_completed = false;
        let streak_count = 0;
        let target_exam: TargetExam = 'CGL';

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          role = data.role === 'admin' ? 'admin' : 'user';
          onboarding_completed = data.onboarding_completed ?? false;
          streak_count = data.streak_count ?? 0;
          target_exam = data.target_exam ?? 'CGL';
        } else {
          // If first login and admin email matches, or default to 'user'
          if (email === 'admin@examrail.in') {
            role = 'admin';
          }
          await setDoc(userDocRef, {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || email.split('@')[0],
            role,
            streak_count: 0,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
          });
        }

        const userObj: User = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || email,
          role,
          target_exam,
          streak_count,
          onboarding_completed,
          current_stage: 1,
        };

        localStorage.setItem('examrail_token', idToken);
        set({
          user: userObj,
          token: idToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return userObj;
      } catch (fbErr: any) {
        console.warn('Firebase login attempt failed; checking backend API fallback...', fbErr.message);
        // Fall back to backend REST API (ensures seeded credentials like admin@examrail.in always work)
      }
    }

    // Backend REST API authentication fallback
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('examrail_token', data.access_token);
    set({
      user: data.user,
      token: data.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
    return data.user;
  },

  register: async (name: string, email: string, password: string) => {
    // If Firebase is configured, register directly with Firebase Auth and Firestore
    if (isFirebaseConfigured) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        await updateProfile(fbUser, { displayName: name });
        const idToken = await fbUser.getIdToken();

        // Enforce safe default role 'user' in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          name,
          email,
          role: 'user',
          streak_count: 0,
          current_stage: 1,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        });

        const userObj: User = {
          id: fbUser.uid,
          name,
          email,
          role: 'user',
          streak_count: 0,
          onboarding_completed: false,
          current_stage: 1,
        };

        localStorage.setItem('examrail_token', idToken);
        set({
          user: userObj,
          token: idToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return userObj;
      } catch (fbErr: any) {
        console.warn('Firebase registration failed; using backend API...', fbErr.message);
      }
    }

    // Backend API registration fallback
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('examrail_token', data.access_token);
    set({
      user: data.user,
      token: data.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
    return data.user;
  },

  fetchCurrentUser: async () => {
    // Listen for Firebase auth state changes if configured
    if (isFirebaseConfigured) {
      onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
            const data = userDocSnap.data();

            const userObj: User = {
              id: fbUser.uid,
              name: fbUser.displayName || data?.name || 'Aspirant',
              email: fbUser.email || '',
              role: data?.role === 'admin' ? 'admin' : 'user',
              streak_count: data?.streak_count ?? 0,
              onboarding_completed: data?.onboarding_completed ?? false,
              target_exam: data?.target_exam ?? 'CGL',
              current_stage: data?.current_stage ?? 1,
            };

            localStorage.setItem('examrail_token', idToken);
            set({ user: userObj, token: idToken, isAuthenticated: true, isLoading: false });
            return;
          } catch (e) {
            console.error('Error fetching Firestore user profile:', e);
          }
        }
      });
    }

    const token = localStorage.getItem('examrail_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await apiRequest<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('examrail_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  logout: () => {
    if (isFirebaseConfigured) {
      signOut(auth).catch((err) => console.warn('Firebase signout warning:', err));
    }
    localStorage.removeItem('examrail_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
