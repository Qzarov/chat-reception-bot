import { Context } from 'telegraf';

export interface SessionData {
  step?: string; // Текущий шаг в процессе диалога
  username?: string;
  stayTuned?: string,
}

export interface RegisteringUserContext extends Context {
  session: SessionData;
}
export const ctxSteps = {
  startApprove: 'startApprove',
  stayTuned: 'stayTuned',
  verification: 'verification',
};

export const ctxNextStep = {
  startApprove: ctxSteps.stayTuned,
  stayTuned: ctxSteps.verification,
};

export const ctxPreviousStep = {
  startApprove: ctxSteps.startApprove,  
  stayTuned: ctxSteps.startApprove,
};

export const ctxStepReply = {
  startApprove: '',
  stayTuned: 'Подтвердите свое согласие на получение новостей от сообщества выпускников ИТМО'
};
