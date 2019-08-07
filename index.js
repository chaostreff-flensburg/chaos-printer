const util = require('util')
const fs = require('fs')
const request = require('request-promise-native')
const exec = util.promisify(require('child_process').exec)
const writeFile = util.promisify(fs.writeFile)
const TelegramBot = require('node-telegram-bot-api');
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, {polling: true});

bot.on('message', async (msg) => {
	console.log(msg);
	const chatId = msg.chat.id;
  if (msg.text === '/start') {
    bot.sendMessage(chatId, 'Hi! Ich bin der ChaosPrinterBot. Ich drucke deine Bilder aus. Plz no spam');
  } else {
    if (msg.document) {
      bot.sendMessage(chatId, 'Nice Dokument bekommen!');
      const file = await getFile(msg.document)
      await printLabel(file)
    } else if (msg.photo) {
      bot.sendMessage(chatId, 'Nice Foto bekommen!');
      const file = await getFile(msg.photo[0])
      await printLabel(file)
    } else if(msg.text) {
      bot.sendMessage(chatId, 'Nice Nachricht bekommen!');
      const file = await generateLabelFromText(msg.text)
      await printLabel(file)
    } else {
      bot.sendMessage(chatId, 'Ich weiß leider nicht wie ich damit umgehen soll :(');
    }
  }
});

async function getFile(file) {
  // TODO: Use bot.getFileStrem insted of request end the telegram bot endpoint
  const filePathRequest = JSON.parse(await request(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file.file_id}`))
  const filePath = filePathRequest.result.file_path
  const fileReq = await request({
    uri: `https://api.telegram.org/file/bot${botToken}/${filePath}`,
    method: 'GET',
    encoding: 'binary',
    headers: {
      "Content-type": file.mime_type
    }
  })
  return Buffer.from(fileReq, 'binary') 
}

async function generateLabelFromText(text) {
  return null
}

async function printLabel (file) {
  await writeFile('printFile', file)
  await exec('~/.local/bin/brother_ql -b linux_kernel -m QL-810W -p file:///dev/usb/lp0 print printFile -l 62 -d');
}
