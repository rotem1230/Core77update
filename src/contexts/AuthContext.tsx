import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, AppUser, Profile, isSupabaseReady } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    if (!isSupabaseReady) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.code === '42P01' && error.message.includes('does not exist')) {
          console.warn('Profiles table does not exist. User authentication will work without profile data.');
          return null;
        }
        console.error('Error loading user profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let initialized = false;

    // If Supabase is not configured, just set loading to false
    if (!isSupabaseReady) {
      console.log('Supabase not configured, running in demo mode');
      setLoading(false);
      return;
    }

    // בצע sign out אוטומטי בכל פתיחה של האפליקציה כדי לוודא שיחייב התחברות מחדש
    const forceSignOutOnAppStart = async () => {
      try {
        await supabase.auth.signOut();
        console.log('Automatic sign out completed on app start');
      } catch (error) {
        console.warn('Error during automatic sign out:', error);
      }
    };

    // Prevent double initialization in StrictMode
    if (initialized) {
      console.log('Auth already initialized, skipping...');
      return;
    }

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout, continuing without auth');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        initialized = true;
        console.log('Initializing Supabase auth...');
        
        // בצע sign out אוטומטי קודם
        await forceSignOutOnAppStart();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Error getting session:', error);
            // Continue without auth instead of blocking
          } else {
            console.log('Auth session loaded:', session ? 'authenticated' : 'not authenticated');
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              try {
                const userProfile = await loadUserProfile(session.user.id);
                setProfile(userProfile);
              } catch (profileError) {
                console.error('Error loading profile:', profileError);
                // Continue even if profile fails to load
              }
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (mounted) {
            console.log('Auth state changed:', event);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (event === 'SIGNED_IN' && session?.user) {
              const userProfile = await loadUserProfile(session.user.id);
              setProfile(userProfile);
              toast.success('Signed in successfully!');
            } else if (event === 'SIGNED_OUT') {
              setProfile(null);
              toast.success('Signed out successfully!');
            } else if (event === 'USER_UPDATED' && session?.user) {
              const userProfile = await loadUserProfile(session.user.id);
              setProfile(userProfile);
            }
            
            if (event !== 'INITIAL_SESSION') {
              setLoading(false);
            }
          }
        }
      );
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (mounted) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Sign in error: ${error.message}`);
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast.error(`Sign in error: ${authError.message}`);
      return { error: authError };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast.error(`Sign up error: ${error.message}`);
      } else {
        toast.success('Signed up successfully! Check your email to confirm your account.');
      }

      return { error };
    } catch (error) {
      const authError = error as AuthError;
      toast.error(`Sign up error: ${authError.message}`);
      return { error: authError };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(`Sign out error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Sign out error');
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        // Check if the error is because the table doesn't exist
        if (error.code === '42P01' && error.message.includes('does not exist')) {
          const profileError = new Error('Profiles table does not exist. Please set up the profiles table in your Supabase database. See SUPABASE_SETUP.md for instructions.');
          toast.error(profileError.message);
          return { error: profileError };
        }
        toast.error(`Profile update error: ${error.message}`);
        return { error };
      }

      // Reload profile
      const updatedProfile = await loadUserProfile(user.id);
      setProfile(updatedProfile);
      
      toast.success('Profile updated successfully!');
      return { error: null };
    } catch (error) {
      toast.error('Profile update error');
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isConfigured: isSupabaseReady,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 