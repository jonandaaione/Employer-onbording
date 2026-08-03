import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { seedCompanyData } from '@/lib/seed';
import type { Profile, Company, Role } from '@/lib/types';

interface AuthContextValue {
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signUp: (params: {
    companyName: string;
    companyEmail: string;
    name: string;
    email: string;
    password: string;
    plan?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    setProfile(prof as Profile | null);
    if (prof) {
      const { data: comp } = await supabase
        .from('companies')
        .select('*')
        .eq('id', prof.company_id)
        .maybeSingle();
      setCompany(comp as Company | null);
    } else {
      setCompany(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        (async () => {
          await loadProfile(data.session!.user.id);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        (async () => {
          await loadProfile(sess.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp(params: {
    companyName: string;
    companyEmail: string;
    name: string;
    email: string;
    password: string;
    plan?: string;
  }): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign-up failed.' };

    const { data: comp, error: compErr } = await supabase
      .from('companies')
      .insert({
        name: params.companyName,
        email: params.companyEmail,
        subscription_plan: params.plan ?? 'starter',
      })
      .select()
      .single();
    if (compErr) return { error: compErr.message };

    const { error: profErr } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      company_id: comp.id,
      role: 'hr_admin' as Role,
      name: params.name,
      email: params.email,
      status: 'active',
    });
    if (profErr) return { error: profErr.message };

    const { data: profRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (profRow) await seedCompanyData(comp.id, profRow.id);

    await loadProfile(data.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setCompany(null);
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, company, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
