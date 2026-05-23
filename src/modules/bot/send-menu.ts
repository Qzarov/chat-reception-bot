import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { TelegramChatEntity } from '@modules/send';
import { SendSettings } from './types';

export const toggleSelectedGroup = (selectedGroupIds: string[], chatId: string): string[] => {
  return selectedGroupIds.includes(chatId)
    ? selectedGroupIds.filter((selectedChatId) => selectedChatId !== chatId)
    : [...selectedGroupIds, chatId];
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

export const buildSendSettingsKeyboard = (
  settings: SendSettings,
  knownGroupsCount: number,
  groups?: TelegramChatEntity[],
): InlineKeyboardMarkup => {
  const inline_keyboard: InlineKeyboardMarkup['inline_keyboard'] = [
    [
      {
        text: `${settings.includePrivate ? '☑' : '☐'} В личку`,
        callback_data: 'send_toggle_private',
      },
      {
        text: `${settings.includeGroups ? '☑' : '☐'} В группы`,
        callback_data: 'send_toggle_groups',
      },
      {
        text: `${settings.includeParticipation ? '☑' : '☐'} Участие`,
        callback_data: 'send_toggle_participation',
      },
    ],
  ];

  if (settings.includeGroups && groups) {
    const groupButtons = groups.map((group) => ({
      text: `${settings.selectedGroupIds.includes(group.chatId) ? '☑' : '☐'} ${group.title || group.chatId}`,
      callback_data: `send_group:${group.chatId}`,
    }));

    inline_keyboard.push(
      ...chunk(groupButtons, 2),
    );
  }

  inline_keyboard.push(
    [
      { text: '✅ Отправить', callback_data: 'confirm_send' },
      { text: '↩️ Заменить', callback_data: 'new_message' },
      { text: '❌ Отмена', callback_data: 'cancel' },
    ],
  );

  return { inline_keyboard };
};

export const buildSendSettingsText = (
  settings: SendSettings,
  privateRecipientsCount: number,
  knownGroupsCount: number,
) =>
  [
    'Настройте отправку.',
    `Получателей в личку: ${privateRecipientsCount}`,
    `Группы: выбрано ${settings.selectedGroupIds.length} из ${knownGroupsCount}`,
  ].join('\n');
