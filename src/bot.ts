import {Context, Markup, Telegraf} from "telegraf";
import {getHabits, getUser, resetUser, setUserState, setUserTimezone} from "./database";

require('dotenv').config();
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not defined');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const getMessageText = (ctx: Context): string => {
  //@ts-ignore
  return ctx.message.text;
}

const onMessage = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return;
  }
  const user = await getUser(userId);

  switch (user.state) {
    case 'none':
      const userName = ctx.from?.first_name;
      const habits = await getHabits(userId);

      if (habits.length === 0) {
        return ctx.reply(`Hello ${userName}, you have no habits.\nPlease add a habit by typing /add_habit.`);
      }

      return ctx.reply(`Hello ${userName}, you have ${habits.length} habits.`);

    case 'set_timezone':
      return ctx.reply('Please set your timezone.', Markup.inlineKeyboard([

        [
          {text: '+02:00', callback_data: JSON.stringify({type: 'set_timezone', timezone: '+02:00'})},
          {text: '+03:00', callback_data: JSON.stringify({type: 'set_timezone', timezone: '+03:00'})},
          {text: '+04:00', callback_data: JSON.stringify({type: 'set_timezone', timezone: '+04:00'})},
        ],
        [
          {text: 'Cancel', callback_data: JSON.stringify({type: 'cancel'})},
        ]
      ]));
    case 'add_habit':
      const habitTitle = getMessageText(ctx).slice(0, 50);
      await ctx.reply(`Habit ${habitTitle} added.`);
  }
}

const onCommand = async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return;
  }
  const user = await getUser(userId);
  const command = getMessageText(ctx)

  switch (command) {
    case '/add_habit':
      if (!user.timezone) {
        await setUserState(userId, 'set_timezone');
      } else {
        await setUserState(userId, 'add_habit');
        return ctx.reply(`Send habit title`);
      }
      break;
    case '/reset':
      await resetUser(userId);
      break;
  }

  return onMessage(ctx)
}

bot.command('add_habit', onCommand);
bot.command('reset', onCommand);

bot.on('callback_query', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return;
  }

  try {
    const data = JSON.parse(ctx.update.callback_query.data || '');

    switch (data.type) {
      case 'set_timezone':
        await setUserTimezone(userId, data.timezone)
        await setUserState(userId, 'add_habit');
        await ctx.reply(`Send habit title`);
        return Promise.all([
          ctx.editMessageReplyMarkup({inline_keyboard: []}),
          ctx.editMessageText(`Timezone set to ${data.timezone}`),
          onMessage(ctx),
        ])
      case 'cancel':
        return Promise.all([
          setUserState(userId, 'none'),
          ctx.editMessageReplyMarkup({inline_keyboard: []}),
          ctx.deleteMessage(),
        ])
    }
  } catch (e) {
    return;
  }
})

bot.on('message', onMessage);

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
