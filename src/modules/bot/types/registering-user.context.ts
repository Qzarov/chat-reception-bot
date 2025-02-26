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
