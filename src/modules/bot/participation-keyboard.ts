export const buildParticipationReplyMarkup = (
  eventId: number,
  count: number,
  botUsername: string,
) => ({
  inline_keyboard: [
    [
      { text: `Я иду · ${count}`, callback_data: `event_join:${eventId}` },
      { text: 'Кто идет', url: `https://t.me/${botUsername}?start=event_${eventId}` },
    ],
  ],
});
