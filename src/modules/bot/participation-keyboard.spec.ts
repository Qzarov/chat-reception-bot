import { buildParticipationReplyMarkup } from './participation-keyboard';

describe('buildParticipationReplyMarkup', () => {
  it('places join and participant list buttons in one row', () => {
    const keyboard = buildParticipationReplyMarkup(42, 3, 'alumni_reception_bot');

    expect(keyboard.inline_keyboard).toHaveLength(1);
    expect(keyboard.inline_keyboard[0]).toEqual([
      { text: 'Я иду · 3', callback_data: 'event_join:42' },
      { text: 'Кто идет', url: 'https://t.me/alumni_reception_bot?start=event_42' },
    ]);
  });
});
