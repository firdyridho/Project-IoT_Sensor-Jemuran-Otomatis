export interface User {
  id: string;
  name: string;
  username: string;
  telegramChatId?: string;
  alarmTone?: string;
  customAlarmUrl?: string;
  theme?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  rememberMe: boolean;
}
