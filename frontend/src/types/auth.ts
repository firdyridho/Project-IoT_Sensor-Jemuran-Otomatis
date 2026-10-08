export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  rememberMe: boolean;
}
