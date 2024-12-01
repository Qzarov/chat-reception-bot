import { Context } from 'telegraf';

export interface SessionData {
  step?: string; // Текущий шаг в процессе диалога
  name?: string;
  surname?: string;
  about?: string;
  bio?: string;
  goal?: string;
}

export interface RegisteringUserContext extends Context {
  session: SessionData;
}
