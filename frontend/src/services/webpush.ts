// Web Push Notification & VAPID Integration Service (REQ-FE-09 / REQ-BE-09)

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class WebPushService {
  /**
   * Check if Web Push API and Service Worker are supported in current browser
   */
  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get existing Push Subscription if already registered
   */
  public static async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch {
      return null;
    }
  }

  /**
   * Request permission, register VAPID key with PushManager, and save to backend
   */
  public static async subscribe(
    backendUrl: string,
    deviceId?: string,
    token?: string
  ): Promise<{ success: boolean; message: string; subscription?: PushSubscription }> {
    if (!this.isSupported()) {
      return { success: false, message: 'Browser Anda tidak mendukung Web Push Notification.' };
    }

    try {
      // 1. Request notification permission from user
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message:
            permission === 'denied'
              ? 'Izin notifikasi ditolak di browser. Silakan aktifkan di pengaturan browser Anda.'
              : 'Izin notifikasi tidak diberikan.',
        };
      }

      // 2. Ensure Service Worker is registered
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Fetch VAPID Public Key from Backend
      const cleanUrl = backendUrl.replace(/\/+$/, '');
      const keyRes = await fetch(`${cleanUrl}/api/notifications/vapid-public-key`).catch(() =>
        fetch(`${cleanUrl}/api/notifications/vapid-key`)
      );

      if (!keyRes.ok) {
        throw new Error(`Gagal mengambil VAPID Public Key (HTTP ${keyRes.status})`);
      }

      const keyData = await keyRes.json();
      const vapidPublicKey = keyData.publicKey || keyData.public_key || keyData.vapidKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID Public Key kosong dari server');
      }

      // 4. Subscribe to PushManager using applicationServerKey
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey.buffer as ArrayBuffer,
        });
      }

      // 5. Send subscription payload to backend
      const rawSub = sub.toJSON();
      const payload = {
        deviceId: deviceId || '',
        endpoint: sub.endpoint,
        keys: {
          p256dh: rawSub.keys?.p256dh || '',
          auth: rawSub.keys?.auth || '',
        },
        userAgent: navigator.userAgent,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const saveRes = await fetch(`${cleanUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${saveRes.status} saat menyimpan langganan`);
      }

      return {
        success: true,
        message: 'Notifikasi Push Realtime berhasil diaktifkan!',
        subscription: sub,
      };
    } catch (err: any) {
      console.error('[WebPush] Gagal mengaktifkan push:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan saat mengaktifkan notifikasi.',
      };
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public static async unsubscribe(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return { success: false, message: 'Web Push tidak didukung.' };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      return { success: true, message: 'Langganan notifikasi push berhasil dinonaktifkan.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menonaktifkan notifikasi push.' };
    }
  }

  /**
   * Send a test push notification via backend API (REQ-BE-09)
   */
  public static async testPush(
    backendUrl: string,
    deviceId?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanUrl = backendUrl.replace(/\/+$/, '');
    try {
      const res = await fetch(`${cleanUrl}/api/notifications/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deviceId || '',
          title: '🌧️ Uji Notifikasi Hujan Rintik',
          body: 'Notifikasi push PWA berhasil berfungsi dengan baik! Jemuran Anda terlindungi.',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.error || `HTTP ${res.status}` };
      }

      return { success: true, message: 'Notifikasi uji berhasil dikirim ke perangkat Anda!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mengirim notifikasi uji.' };
    }
  }
}
