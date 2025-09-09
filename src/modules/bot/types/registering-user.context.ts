import { Context } from 'telegraf';

export interface SessionData {
  state?: string;
  step?: string; // Текущий шаг в процессе диалога
  username?: string;
  stayTuned?: string,
  messageToSend?: TelegramMessage;
}

export interface MessageFormatEntities {
  offset: number;
  length: number;
  type: string;
}


export interface TelegramMessage {
  text: string;
  entities: MessageFormatEntities[];
  fileId: string;
  caption: string;
}

export interface UserContext extends Context {
  session: SessionData;
}
