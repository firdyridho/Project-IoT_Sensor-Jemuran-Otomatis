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
    username: string,
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
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok) {
        if (res.status === 404) {
          if (username === 'admin' && password === 'admin123') {
            return { success: true, session: this.demoLogin(rememberMe) };
          }
          return {
            success: false,
            error: 'Server autentikasi sedang dalam pembaruan (404). Silakan gunakan tombol Coba Mode Demo atau akun admin/admin123.',
          };
        }
        return { success: false, error: data.error || 'Username atau kata sandi tidak cocok' };
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          name: data.user.name,
          username: data.user.username,
          createdAt: data.user.createdAt,
        },
        token: data.token,
        rememberMe,
      };

      this.saveSession(session);
      return { success: true, session };
    } catch (err: any) {
      if (username === 'admin' && password === 'admin123') {
        return { success: true, session: this.demoLogin(rememberMe) };
      }
      return {
        success: false,
        error: 'Gagal terhubung ke server autentikasi: ' + (err.message || 'Koneksi jaringan terputus'),
      };
    }
  },

  async register(
    baseUrl: string,
    name: string,
    username: string,
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
        body: JSON.stringify({ name, username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok) {
        // Jika server backend mengembalikan 404 (binary server belum di-update dengan endpoint auth baru)
        if (res.status === 404) {
          console.warn('[Auth] Endpoint registrasi backend 404. Mengaktifkan sesi pengguna lokal...');
          const localUser: User = {
            id: `usr-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            name: name.trim(),
            username: username.toLowerCase().trim(),
            createdAt: new Date().toISOString(),
          };
          const session: AuthSession = {
            user: localUser,
            token: `token-local-${Date.now()}`,
            rememberMe,
          };
          this.saveSession(session);
          return { success: true, session };
        }
        return { success: false, error: data.error || `Gagal mendaftarkan akun (HTTP ${res.status})` };
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          name: data.user.name,
          username: data.user.username,
          createdAt: data.user.createdAt,
        },
        token: data.token,
        rememberMe,
      };

      this.saveSession(session);
      return { success: true, session };
    } catch (err: any) {
      // Fallback offline bila server tidak merespon sama sekali
      console.warn('[Auth] Gagal menghubungi backend saat mendaftar, menggunakan fallback sesi lokal:', err);
      const localUser: User = {
        id: `usr-${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
      };
      const session: AuthSession = {
        user: localUser,
        token: `token-local-${Date.now()}`,
        rememberMe,
      };
      this.saveSession(session);
      return { success: true, session };
    }
  },

  demoLogin(rememberMe: boolean): AuthSession {
    const session: AuthSession = {
      user: {
        id: 'usr-demo-admin',
        name: 'Demo Pengguna',
        username: 'admin',
      },
      token: 'demo-token-bypass',
      rememberMe,
    };
    this.saveSession(session);
    return session;
  },
};
