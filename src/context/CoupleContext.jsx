import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';

const CoupleContext = createContext();

export const useCouple = () => useContext(CoupleContext);

export const CoupleProvider = ({ children }) => {
  const { setReferencePalette } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep local data structure for now until DB migration is complete
  const [coupleData, setCoupleData] = useState(() => {
    const saved = localStorage.getItem('coupleData');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      personA: parsed.personA || { name: '', age: '', photo: null, color: '#e17055', nickname: '', bio: '' },
      personB: parsed.personB || { name: '', age: '', photo: null, color: '#0984e3', nickname: '', bio: '' },
      couple: parsed.couple || { name: '', meetDate: '', officialDate: '', meetPlace: '', quote: '', photo: null, song: '' },
      security: parsed.security || { pin: '', individualCodes: {} },
      isAuthenticated: false // Always start false, wait for session check
    };
  });

  useEffect(() => {
    // Check active session and fetch data
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCoupleData(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCoupleData(session.user.id);
      else {
        setCoupleData(prev => ({ ...prev, isAuthenticated: false }));
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCoupleData = async (userId) => {
    try {
      setLoading(true);
      // 1. Check if profile exists
      // 1. Check if profile exists
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*, couples(*)')
        .eq('id', userId)
        .single();

      if (!profile) {
        // No profile found (New User).
        // Set isAuthenticated to true so they can access Onboarding.
        // But do NOT create any data yet.
        setCoupleData(prev => ({
          ...prev,
          isAuthenticated: true,
          // Reset data to avoid stale state from previous session
          personA: { name: '', age: '', photo: null, color: '#e17055', nickname: '', bio: '' },
          personB: { name: '', age: '', photo: null, color: '#0984e3', nickname: '', bio: '' },
          couple: { name: '', meetDate: '', officialDate: '', meetPlace: '', quote: '', photo: null, song: '', dashboard_layout: null },
          security: { pin: '', individualCodes: {} }
        }));
        setLoading(false);
        return;
      } else {
        // Sync email if missing
        if (!profile.email && session?.user?.email) {
          await supabase.from('profiles').update({ email: session.user.email }).eq('id', userId);
        }
      }

      // 2. Fetch partner profile
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .neq('id', userId)
        .single();

      // 3. Update State
      // 3. Update State
      const fetchedCouple = {
        id: profile.couple_id,
        name: profile.couples?.name || '',
        meetDate: profile.couples?.meet_date || '',
        officialDate: profile.couples?.official_date || '',
        meetPlace: profile.couples?.meet_place || '',
        quote: profile.couples?.quote || '',
        song: profile.couples?.song || '',
        theme_config: profile.couples?.theme_config || null,
        dashboard_layout: profile.couples?.dashboard_layout || null
      };

      setCoupleData({
        personA: {
          name: profile.full_name || '',
          color: profile.color || '#e17055',
          photo: profile.avatar_url,
          id: profile.id,
          username: profile.username
        },
        personB: {
          name: partnerProfile?.full_name || 'Partenaire',
          color: partnerProfile?.color || '#0984e3',
          photo: partnerProfile?.avatar_url,
          id: partnerProfile?.id,
          username: partnerProfile?.username
        },
        couple: fetchedCouple,
        security: { pin: '', individualCodes: {} },
        isAuthenticated: true
      });

      // Sync Theme Context
      setReferencePalette(fetchedCouple.theme_config);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePersonA = async (newData) => {
    try {
      const { error } = await supabase.from('profiles').update(newData).eq('id', coupleData.personA.id);
      if (error) throw error;
      setCoupleData(prev => ({ ...prev, personA: { ...prev.personA, ...newData } }));
    } catch (error) {
      console.error('Error updating Person A:', error);
      throw error;
    }
  };

  const updatePersonB = async (newData) => {
    try {
      const { error } = await supabase.from('profiles').update(newData).eq('id', coupleData.personB.id);
      if (error) throw error;
      setCoupleData(prev => ({ ...prev, personB: { ...prev.personB, ...newData } }));
    } catch (error) {
      console.error('Error updating Person B:', error);
      throw error;
    }
  };

  const updateCouple = async (newData) => {
    try {
      // Map frontend keys to DB columns if necessary, or ensure they match
      const dbData = {};
      if (newData.name) dbData.name = newData.name;
      if (newData.meetDate) dbData.meet_date = newData.meetDate;
      if (newData.officialDate) dbData.official_date = newData.officialDate;
      if (newData.meetPlace) dbData.meet_place = newData.meetPlace;
      if (newData.quote) dbData.quote = newData.quote;
      if (newData.song) dbData.song = newData.song;
      if (newData.pin) dbData.pin_code = newData.pin;

      // Explicitly handle theme_config (can be null for reset)
      if (newData.hasOwnProperty('theme_config')) {
        dbData.theme_config = newData.theme_config;
      }

      // Handle dashboard_layout
      if (newData.hasOwnProperty('dashboard_layout')) {
        dbData.dashboard_layout = newData.dashboard_layout;
      }

      const { error } = await supabase.from('couples').update(dbData).eq('id', coupleData.couple.id);
      if (error) throw error;

      setCoupleData(prev => ({ ...prev, couple: { ...prev.couple, ...newData } }));

      // Sync Theme Context Immediately for Responsiveness
      if (newData.hasOwnProperty('theme_config')) {
        setReferencePalette(newData.theme_config);
      }
    } catch (error) {
      console.error('Error updating Couple:', error);
      throw error;
    }
  };

  const deleteCouple = async () => {
    try {
      const coupleId = coupleData.couple.id;
      if (!coupleId) return;

      // 1. Unlink profiles (or delete them if you want total reset, but keeping account is safer)
      // Let's unlink so they fall back to "No Couple" state
      const { error: unlinkError } = await supabase
        .from('profiles')
        .update({ couple_id: null })
        .eq('couple_id', coupleId);

      if (unlinkError) throw unlinkError;

      // 2. Delete Couple (Cascade should handle messages etc if DB is set up, otherwise we might leave orphans)
      // Assuming DB handles cascade or we don't care about orphans for now
      const { error: deleteError } = await supabase
        .from('couples')
        .delete()
        .eq('id', coupleId);

      if (deleteError) throw deleteError;

      // 3. Reset Local State
      // This will trigger ProtectedRoute to redirect to Onboarding
      setCoupleData(prev => ({
        ...prev,
        couple: { name: '', meetDate: '', officialDate: '', meetPlace: '', quote: '', photo: null, song: '', dashboard_layout: null },
        personA: { name: '', age: '', photo: null, color: '#e17055', nickname: '', bio: '' },
        personB: { name: '', age: '', photo: null, color: '#0984e3', nickname: '', bio: '' },
        // Keep isAuthenticated true so they stay logged in but go to onboarding
      }));

    } catch (error) {
      console.error('Error deleting couple:', error);
      throw error;
    }
  };

  const updateSecurity = async (newData) => { console.log('Update Security', newData); };

  const login = async (identifier, password) => {
    let email = identifier;

    // Handle @username
    if (identifier.startsWith('@')) {
      identifier = identifier.substring(1);
    }

    // Check if identifier is a username (no @ or was stripped)
    if (!identifier.includes('@')) {
      // Lookup email by username (lowercase comparison)
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier.toLowerCase())
        .single();

      if (error || !data) throw new Error("Nom d'utilisateur introuvable");
      email = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  };

  const signup = async (email, password, username, fullName) => {
    // Check if username exists first
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error("Ce nom d'utilisateur est déjà pris.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.status === 422) {
        throw new Error("Cette adresse email est déjà utilisée.");
      }
      throw error;
    }

    // Check if user identity matches (sometimes Supabase returns fake success for security)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("Cette adresse email est déjà utilisée.");
    }

    return data;
  };

  const logout = async () => {
    try {
      // Attempt server logout, but don't block local logout if it fails (e.g. 403, session missing)
      const { error } = await supabase.auth.signOut();
      if (error) console.warn("Logout warning:", error.message);
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      // Always clear local state
      setCoupleData(prev => ({ ...prev, isAuthenticated: false }));
      setSession(null);
    }
  };

  return (
    <CoupleContext.Provider value={{
      coupleData,
      session,
      loading,
      updatePersonA,
      updatePersonB,
      updateCouple,
      updateSecurity,
      login,
      signup,
      logout,
      fetchCoupleData,
      deleteCouple
    }}>
      {!loading && children}
    </CoupleContext.Provider>
  );
};
