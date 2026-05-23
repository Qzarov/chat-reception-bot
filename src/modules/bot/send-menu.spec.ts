import { buildSendSettingsKeyboard, buildSendSettingsText, toggleSelectedGroup } from './send-menu';
import { SendSettings } from './types';
import { TelegramChatEntity } from '@modules/send';

const baseSettings: SendSettings = {
  includePrivate: false,
  includeGroups: false,
  includeParticipation: false,
  selectedGroupIds: [],
};

describe('send-menu', () => {
  it('renders toggles and selected group count', () => {
    const keyboard = buildSendSettingsKeyboard(baseSettings, 3);

    expect(keyboard.inline_keyboard[0][0].text).toBe('☐ В личку');
    expect(keyboard.inline_keyboard[0][1].text).toBe('☐ В группы');
    expect(keyboard.inline_keyboard[0][2].text).toBe('☐ Участие');
    expect(keyboard.inline_keyboard[1][0].text).toBe('✅ Отправить');
  });

  it('toggles a group id without duplicates', () => {
    expect(toggleSelectedGroup(['-1001'], '-1001')).toEqual([]);
    expect(toggleSelectedGroup(['-1001'], '-1002')).toEqual(['-1001', '-1002']);
  });

  it('renders selected group menu items two per row without done button', () => {
    const chats: TelegramChatEntity[] = [
      { id: 1, chatId: '-1001', title: 'Main', type: 'supergroup', isActive: true },
      { id: 2, chatId: '-1002', title: 'Test', type: 'group', isActive: true },
      { id: 3, chatId: '-1003', title: 'Third', type: 'group', isActive: true },
    ];

    const keyboard = buildSendSettingsKeyboard(
      { ...baseSettings, includeGroups: true, selectedGroupIds: ['-1002'] },
      chats.length,
      chats,
    );

    expect(keyboard.inline_keyboard[1][0].text).toBe('☐ Main');
    expect(keyboard.inline_keyboard[1][1].text).toBe('☑ Test');
    expect(keyboard.inline_keyboard[2][0].text).toBe('☐ Third');
    expect(keyboard.inline_keyboard.flat().map((button) => button.text)).not.toContain('Готово');
  });

  it('does not render group menu items when group sending is disabled', () => {
    const chats: TelegramChatEntity[] = [
      { id: 1, chatId: '-1001', title: 'Main', type: 'supergroup', isActive: true },
    ];

    const keyboard = buildSendSettingsKeyboard(baseSettings, chats.length, chats);

    expect(keyboard.inline_keyboard.flat().map((button) => button.text)).not.toContain('☐ Main');
  });

  it('renders selected group count in settings text', () => {
    expect(
      buildSendSettingsText(
        { ...baseSettings, selectedGroupIds: ['-1002'] },
        12,
        3,
      ),
    ).toBe('Настройте отправку.\nПолучателей в личку: 12\nГруппы: выбрано 1 из 3');
  });
});
