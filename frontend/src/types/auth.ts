export interface User {
  id: string;
  name: string;
  username: string;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  rememberMe: boolean;
}
