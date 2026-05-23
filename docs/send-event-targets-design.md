# `/send` Targets and Event Buttons Design

## Goal

Extend `/send` so an admin can prepare one post, choose delivery targets in inline settings, optionally add participation buttons, and publish to personal chats and selected Telegram groups.

## Current Behavior

`/send` starts a private admin flow, waits for a text/photo message, then asks for confirmation and sends the message to users with `stayTuned=true`.

## Target Behavior

After the admin provides the post, the bot shows a settings menu:

- `☑ В личку участникам`
- `☐ В группы`
- `Группы: N выбрано`
- `☐ Добавить кнопки участия`
- `✅ Отправить`
- `↩️ Заменить`
- `❌ Отмена`

The bot records groups/channels when it receives `my_chat_member` updates showing it was added to a chat. Stored chats appear in the group selection menu.

If participation buttons are enabled, one event is created for the `/send` campaign. All published copies share the same participant list. A repeated `Я иду` click does not remove the participant; the bot answers `Ты уже идешь`.

## Data Model

- `telegram_chats`: known groups/supergroups/channels where the bot was added.
- `events`: stable event entity. MVP creates one new event per participation-enabled `/send`; future UI can attach later posts to an existing event.
- `send_campaigns`: one prepared `/send` publication, linked to an event when participation is enabled.
- `send_campaign_targets`: each delivered copy, including target type, chat id, and Telegram message id.
- `send_campaign_participants`: users who clicked `Я иду`, unique per event and Telegram user.

## Future TODO

Add `Привязать к событию` in the `/send` settings menu. First event post creates the event; later posts can select an existing event and reuse its participant list.

## Acceptance Criteria

- `/send` still supports text and photo posts.
- Admin can toggle personal delivery and group delivery independently.
- Admin can select one or more known groups when group delivery is enabled.
- Bot stores known chats after being added to groups/channels.
- Participation buttons create one shared participant list for the campaign.
- `Я иду` adds a participant once and updates counters on all campaign target messages.
- `Кто идет` opens the bot and shows usernames/names for the event.
- README documents the new `/send` flow.

