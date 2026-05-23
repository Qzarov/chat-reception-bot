import { buildSendSettingsKeyboard, toggleSelectedGroup } from './send-menu';
import { SendSettings } from './types';
import { TelegramChatEntity } from '@modules/send';

const baseSettings: SendSettings = {
  includePrivate: true,
  includeGroups: false,
  includeParticipation: false,
  selectedGroupIds: [],
};

describe('send-menu', () => {
  it('renders toggles and selected group count', () => {
    const keyboard = buildSendSettingsKeyboard(baseSettings, 3);

    expect(keyboard.inline_keyboard[0][0].text).toBe('☑ В личку участникам');
    expect(keyboard.inline_keyboard[1][0].text).toBe('☐ В группы');
    expect(keyboard.inline_keyboard[2][0].text).toBe('Группы: 0 из 3');
    expect(keyboard.inline_keyboard[3][0].text).toBe('☐ Добавить кнопки участия');
  });

  it('toggles a group id without duplicates', () => {
    expect(toggleSelectedGroup(['-1001'], '-1001')).toEqual([]);
    expect(toggleSelectedGroup(['-1001'], '-1002')).toEqual(['-1001', '-1002']);
  });

  it('renders selected group menu items', () => {
    const chats: TelegramChatEntity[] = [
      { id: 1, chatId: '-1001', title: 'Main', type: 'supergroup', isActive: true },
      { id: 2, chatId: '-1002', title: 'Test', type: 'group', isActive: true },
    ];

    const keyboard = buildSendSettingsKeyboard(
      { ...baseSettings, includeGroups: true, selectedGroupIds: ['-1002'] },
      chats.length,
      chats,
    );

    expect(keyboard.inline_keyboard[3][0].text).toBe('☐ Main');
    expect(keyboard.inline_keyboard[4][0].text).toBe('☑ Test');
  });
});
