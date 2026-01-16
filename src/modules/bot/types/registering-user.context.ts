import { Context } from 'telegraf';

export interface SessionData {
  state?: string;
  step?: string; // Текущий шаг в процессе диалога
  username?: string;
  name?: string;
  surname?: string;
  fatherName?: string;
  uniFinishedYear?: number;
  faculty?: string;
  stayTuned?: string,
  messageToSend?: TelegramMessage;
}

export interface MessageFormatEntities {
  offset: number;
  length: number;
  type: string;
}


export const ctxSteps = {
  startApprove: 'startApprove',
  stayTuned: 'stayTuned',
  verification: 'verification',
  name: 'name',
  surname: 'surname',
  fatherName: 'fatherName',
  uniFinishedYear: 'uniFinishedYear',
  faculty: 'faculty',
};

export interface TelegramMessage {
  type: string,
  text?: string;
  entities?: MessageFormatEntities[];
  fileId?: string;
  caption?: string;
}

export interface UserContext extends Context {
  session: SessionData;
}

export const ctxNextStep = {
  startApprove: ctxSteps.name,
  name: ctxSteps.surname,
  surname: ctxSteps.fatherName,
  fatherName: ctxSteps.uniFinishedYear,
  uniFinishedYear: ctxSteps.faculty,
  faculty: ctxSteps.verification,
};

export const ctxPreviousStep = {
  startApprove: ctxSteps.startApprove,
  name: ctxSteps.startApprove,
  surname: ctxSteps.name,
  fatherName: ctxSteps.surname,
  uniFinishedYear: ctxSteps.fatherName,
  faculty: ctxSteps.uniFinishedYear,
  verification: ctxSteps.faculty,
};

export const ctxStepReply = {
  startApprove: '',
  name: 'Ваше имя:',
  surname: 'Ваша фамилия (если менялась, укажите обе):',
  fatherName: 'Ваше отчество:',
  uniFinishedYear: 'Год окончания университета (только номер года):',
  faculty: 'Ваш факультет:',
  verification: 'Обрабатываем ваши данные. Как только ваш статус выпускника будет подтвержден, мы отправим вам ссылку на чат клуба.\nСпасибо за терпение!'
};