import { Context } from 'telegraf';

export interface SessionData {
  step?: string; // Текущий шаг в процессе диалога
  username?: string;
  name?: string;
  surname?: string;
  fatherName?: string;
  email?: string;
  uniFinishedYear?: number;
  faculty?: string;
  workCompany?: string;
  workPosition?: string;
  professionalСompetencies?: string;
  clubActivities?: string;
  readyToHelpClub?: boolean;
  addCompanyToCatalogue?: boolean;
  openCatalogueData?: boolean;
  valueFromClub?: string;
}

export interface RegisteringUserContext extends Context {
  session: SessionData;
}
export const ctxSteps = {
  startApprove: 'startApprove',
  name: 'name',
  surname: 'surname',
  fatherName: 'fatherName',
  email: 'email',
  uniFinishedYear: 'uniFinishedYear',
  faculty: 'faculty',
  workCompany: 'workCompany',
  workPosition: 'workPosition',
  professionalСompetencies: 'professionalСompetencies',
  clubActivities: 'clubActivities',
  readyToHelpClub: 'readyToHelpClub',
  addCompanyToCatalogue: 'addCompanyToCatalogue',
  openCatalogueData: 'openCatalogueData',
  valueFromClub: 'valueFromClub',
};

export const ctxNextStep = {
  startApprove: ctxSteps.name,
  name: ctxSteps.surname,
  surname: ctxSteps.fatherName,
  fatherName: ctxSteps.email,
  email: ctxSteps.uniFinishedYear,
  uniFinishedYear: ctxSteps.faculty,
  faculty: ctxSteps.workCompany,
  workCompany: ctxSteps.workPosition,
  workPosition: ctxSteps.professionalСompetencies,
  professionalСompetencies: ctxSteps.clubActivities,
  clubActivities: ctxSteps.readyToHelpClub,
  readyToHelpClub: ctxSteps.addCompanyToCatalogue,
  addCompanyToCatalogue: ctxSteps.openCatalogueData,
  openCatalogueData: ctxSteps.valueFromClub,
  valueFromClub: ctxSteps.valueFromClub,
};

export const ctxPreviousStep = {
  startApprove: ctxSteps.startApprove,
  name: ctxSteps.startApprove,
  surname: ctxSteps.name,
  fatherName: ctxSteps.surname,
  email: ctxSteps.fatherName,
  uniFinishedYear: ctxSteps.email,
  faculty: ctxSteps.uniFinishedYear,
  workCompany: ctxSteps.faculty,
  workPosition: ctxSteps.workCompany,
  professionalСompetencies: ctxSteps.workPosition,
  clubActivities: ctxSteps.professionalСompetencies,
  readyToHelpClub: ctxSteps.clubActivities,
  addCompanyToCatalogue: ctxSteps.readyToHelpClub,
  openCatalogueData: ctxSteps.addCompanyToCatalogue,
  valueFromClub: ctxSteps.openCatalogueData,
};

export const ctxStepReply = {
  startApprove: '',
  name: 'Твое имя:',
  surname: 'Твоя фамилия:',
  fatherName: 'Твое отчество:',
  email: 'Твоя электронная почта:',
  uniFinishedYear: 'Год окончания университета (только число):',
  faculty: 'Твой факультет (аббревиатура):',
  workCompany: 'Компания, в которой ты работаешь:',
  workPosition: 'Позиция, которую ты занимаешь:',
  professionalСompetencies: 'Твои профессиональные компетенции:',
  clubActivities: 'Компетенции и роли, которые готов(-а) исполнять в клубе:',
  readyToHelpClub:
    'Готов(-а) уделять часть времени деятельности клуба? (да / нет)',
  addCompanyToCatalogue:
    'Внести компанию/свои компетенции в реестр? (да / нет)\n\nРеестр - список услуг/компетенций выпускников, которыми они готовы поделиться с университетом или другими выпускниками (в качестве подрядчика/сотрудника/партнера)',
  openCatalogueData:
    'Открыть данные, внесенные в реестр, для участников клуба? (да / нет)',
  valueFromClub: 'Опиши ценность, которую ожидаешь от клуба:',
};
