// Web Push Notification Service (DEPRECATED per REQ-FE-14 / API_CONTRACT_AGREEMENT 7.2)
// Seluruh notifikasi eksternal resmi dialihkan 100% ke Telegram Bot (@Rintik_Iot_Bot).

export class WebPushService {
  public static isSupported(): boolean {
    return false;
  }

  public static async isSubscribed(): Promise<boolean> {
    return false;
  }

  public static async getSubscription(): Promise<null> {
    return null;
  }

  public static async subscribe(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Notifikasi eksternal telah dialihkan ke Telegram Bot. Silakan hubungkan akun Anda di menu Pengaturan.',
    };
  }

  public static async unsubscribe(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Layanan web push browser telah dinonaktifkan.',
    };
  }

  public static async testPush(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Notifikasi browser telah dinonaktifkan. Gunakan fitur uji pesan bot Telegram.',
    };
  }
}
