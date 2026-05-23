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
  stayTuned?: string;
  messageToSend?: TelegramMessage;
  sendSettings?: SendSettings;
}

export interface MessageFormatEntities {
  offset: number;
  length: number;
  type: string;
}

export const ctxSteps = {
  startApprove: 'startApprove',
  stayTuned: 'stayTuned',
  name: 'name',
  surname: 'surname',
  fatherName: 'fatherName',
  uniFinishedYear: 'uniFinishedYear',
  faculty: 'faculty',
  verification: 'verification',
  verified: 'verified',
};

export interface TelegramMessage {
  type: string;
  text?: string;
  entities?: MessageFormatEntities[];
  fileId?: string;
  caption?: string;
  caption_entities?: MessageFormatEntities[];
}

export interface SendSettings {
  includePrivate: boolean;
  includeGroups: boolean;
  includeParticipation: boolean;
  selectedGroupIds: string[];
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
  verification: ctxSteps.verified,
};

export const ctxPreviousStep = {
  startApprove: ctxSteps.startApprove,
  name: ctxSteps.startApprove,
  surname: ctxSteps.name,
  fatherName: ctxSteps.surname,
  uniFinishedYear: ctxSteps.fatherName,
  faculty: ctxSteps.uniFinishedYear,
  verification: ctxSteps.faculty,
  verified: ctxSteps.verification,
};

export const ctxStepReply = {
  startApprove: '',
  name: 'Ваше имя:',
  surname: 'Ваша фамилия (если менялась, укажите обе):',
  fatherName: 'Ваше отчество:',
  uniFinishedYear: 'Год окончания университета (только номер года):',
  faculty: 'Ваш факультет:',
  verification: `Обрабатываем ваши данные. Как только ваш статус выпускника будет подтвержден, мы отправим вам ссылку на чат клуба.\nСпасибо за терпение!`,
  verification1: `Пока вы ожидаете, приглашаем посмотреть подкаст:\n\n*Клуб выпускников ИТМО: как построить сообщество, которое помогает расти в ИТ и бизнесе?*\n\nГости обсудили, как клуб помогает выпускникам расширять бизнес- и карьерные возможности, находить единомышленников и менторов, а также зачем поддерживать связь с альма-матер\n\n*Гости подкаста - выпускники ИТМО*:\n▪️Владислав Самарин, руководитель отдела развития сообщества выпускников ИТМО, директор центра технологического предпринимательства\n▪️Евгений Раскин, проректор по молодежной политике ИТМО\n▪️Михаил Телегин, заместитель генерального директора по стратегическим проектам ОБИТ, выпускник и лидер клуба выпускников ИТМО\n▪️Ведущий - [Константин Хомченко](https://t.me/kh_findx), эксперт по созданию и развитию продуктов, основатель «Есть контакт»\n\n*Смотрим*:\n➡️ [YouTube](https://youtu.be/VHIDmWT-_lE)\n➡️ [ВКонтакте](https://vk.com/video-200053178_456239128)\n➡️ [RuTube](https://rutube.ru/video/ffdac936fb68d9980767c0a5cb1409a8/)`,
  verified: 'Администраторы клуба уже обработали вашу заявку на вступление',
};
