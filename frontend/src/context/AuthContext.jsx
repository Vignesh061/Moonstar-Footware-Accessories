/**
 * AuthContext — Customer authentication state.
 *
 * Stores:
 *   access_token   → customer JWT (never mixed with admin_token)
 *   customer_user  → basic customer data {id, mobile, name}
 *   customer_profile → saved delivery profile (address, city, state…)
 *
 * Admin uses admin_token / admin_user — completely separate.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState(() => readJSON('customer_user'));
  const [profile, setProfile] = useState(() => readJSON('customer_profile'));

  /**
   * Called after successful OTP verification.
   * accessToken — JWT string
   * customerData — {id, mobile, name, …}
   * profileData  — saved delivery profile (may be null for new customers)
   */
  const login = useCallback((accessToken, customerData, profileData = null) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('customer_user', JSON.stringify(customerData));
    if (profileData) {
      localStorage.setItem('customer_profile', JSON.stringify(profileData));
    } else {
      localStorage.removeItem('customer_profile');
    }
    setToken(accessToken);
    setUser(customerData);
    setProfile(profileData);
  }, []);

  /** Update the stored profile without triggering a full logout/login cycle. */
  const updateProfile = useCallback((profileData) => {
    if (profileData) {
      localStorage.setItem('customer_profile', JSON.stringify(profileData));
    } else {
      localStorage.removeItem('customer_profile');
    }
    setProfile(profileData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('customer_profile');
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{
      token, user, profile,
      login, logout, updateProfile,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
