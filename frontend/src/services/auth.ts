import { User, AuthSession } from '../types/auth';

const AUTH_KEY = 'hujan.auth.session';

export const AuthService = {
  getSession(): AuthSession | null {
    try {
      // 1. Check persistent localStorage first (Ingat Saya)
      const localData = localStorage.getItem(AUTH_KEY);
      if (localData) {
        return JSON.parse(localData) as AuthSession;
      }
      // 2. Check tab-only sessionStorage
      const sessionData = sessionStorage.getItem(AUTH_KEY);
      if (sessionData) {
        return JSON.parse(sessionData) as AuthSession;
      }
      return null;
    } catch {
      return null;
    }
  },

  saveSession(session: AuthSession): void {
    const raw = JSON.stringify(session);
    if (session.rememberMe) {
      localStorage.setItem(AUTH_KEY, raw);
      sessionStorage.removeItem(AUTH_KEY);
    } else {
      sessionStorage.setItem(AUTH_KEY, raw);
      localStorage.removeItem(AUTH_KEY);
    }
  },

  clearSession(): void {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  async login(
    baseUrl: string,
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
      const clean = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
      if (!clean) {
        return { success: false, error: 'URL backend tidak tersedia' };
      }

      const res = await fetch(`${clean}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Email atau kata sandi tidak cocok' };
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
        },
        token: data.token,
        rememberMe,
      };

      this.saveSession(session);
      return { success: true, session };
    } catch (err: any) {
      return {
        success: false,
        error: 'Gagal terhubung ke server autentikasi: ' + (err.message || 'Network error'),
      };
    }
  },

  async register(
    baseUrl: string,
    name: string,
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
    try {
      const clean = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
      if (!clean) {
        return { success: false, error: 'URL backend tidak tersedia' };
      }

      const res = await fetch(`${clean}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mendaftarkan akun' };
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
        },
        token: data.token,
        rememberMe,
      };

      this.saveSession(session);
      return { success: true, session };
    } catch (err: any) {
      return {
        success: false,
        error: 'Gagal terhubung ke server pendaftaran: ' + (err.message || 'Network error'),
      };
    }
  },

  demoLogin(rememberMe: boolean): AuthSession {
    const session: AuthSession = {
      user: {
        id: 'usr-demo-admin',
        name: 'Demo Pengguna',
        email: 'demo@hujanpantau.id',
      },
      token: 'demo-token-bypass',
      rememberMe,
    };
    this.saveSession(session);
    return session;
  },
};
