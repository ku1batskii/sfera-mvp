#!/usr/bin/env node
const { Telegraf } = require('telegraf')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.example/pages/telegram-webapp.html'
const BOT_USERNAME = process.env.BOT_USERNAME || 'sferaevents_bot'

if(!BOT_TOKEN){
  console.error('TELEGRAM_BOT_TOKEN is not set. Set TELEGRAM_BOT_TOKEN in environment and restart.')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)

bot.start(async (ctx) => {
  try{
    const webAppUrl = `${WEBAPP_URL}${WEBAPP_URL.includes('?') ? '&' : '?'}bot=${BOT_USERNAME}`
    await ctx.reply('Добро пожаловать в Sfera!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open App', web_app: { url: webAppUrl } }]]
      }
    })
  }catch(err){
    console.error('Error in /start handler', err)
  }
})

bot.command('webapp', async (ctx) => {
  const webAppUrl = `${WEBAPP_URL}${WEBAPP_URL.includes('?') ? '&' : '?'}bot=${BOT_USERNAME}`
  await ctx.reply('Откройте Web App:', {
    reply_markup: { inline_keyboard: [[{ text: 'Open WebApp', web_app: { url: webAppUrl } }]] }
  })
})

bot.command('openapp', async (ctx) => {
  const webAppUrl = `${WEBAPP_URL}${WEBAPP_URL.includes('?') ? '&' : '?'}bot=${BOT_USERNAME}`
  await ctx.reply('Открываем приложение:', {
    reply_markup: { inline_keyboard: [[{ text: 'Open App', web_app: { url: webAppUrl } }]] }
  })
})

bot.on('message', async (ctx) => {
  // Echo simple text and show help for other inputs
  if(ctx.message && ctx.message.text){
    const txt = ctx.message.text.toLowerCase()
    if(txt === 'help' || txt === '/help'){
      await ctx.reply('Команды:\n/start — приветствие и кнопка Web App\n/webapp — ссылка на Web App\n/openapp — открыть приложение')
      return
    }
  }
  await ctx.reply('Команда не распознана. Отправьте /start, /webapp или /openapp.')
})

async function start(){
  try{
    await bot.launch()
    console.log('Telegram bot started')
  }catch(e){
    console.error('Failed to launch bot', e)
    process.exit(1)
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

start()
