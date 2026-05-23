import { buildHelpMessage } from './help-message';

describe('buildHelpMessage', () => {
  it('lists public and admin bot commands', () => {
    const message = buildHelpMessage();

    expect(message).toContain('/start');
    expect(message).toContain('/help');
    expect(message).toContain('/id');
    expect(message).toContain('/send');
    expect(message).toContain('/checkUser &lt;telegramId&gt;');
    expect(message).toContain('/verify &lt;telegramId&gt;');
    expect(message).toContain('кнопками участия');
  });
});
