const fs = require('fs');
const stream = require('stream');
const fetch = require('node-fetch');
const express = require('express');
const canvas = require('canvas');
const util = require('util');
const { text } = require('express');

const streamPipeline = util.promisify(stream.pipeline);
const fonts = [];
let settings;

start();

async function start() {
 loadSettings('settings.json');
 await getFonts();
 const app = express();
 const port = 3000;
 app.get('/image', async (req, res) => {
  let info = await getJSON('https://api.github.com/users/libersoft-org');
  // https://api.github.com/repos/libersoft-org/email-sender
  if (info) await createImage(req, res, info);
  else createEmptyImage(req, res);
 });
 app.listen(port, () => {
  setLog('Server is listening on port: ' + port);
 });
}

async function getFonts() {
 fonts['regular'] = {
  name: 'Ubuntu Regular',
  url: 'https://github.com/google/fonts/raw/main/ufl/ubuntu/Ubuntu-Regular.ttf',
  file: 'Ubuntu-Regular.ttf'
 }
 fonts['bold'] = {
  name: 'Ubuntu Bold',
  url: 'https://github.com/google/fonts/raw/main/ufl/ubuntu/Ubuntu-Bold.ttf',
  file: 'Ubuntu-Bold.ttf'
 }
 await getFont(fonts['regular']);
 await getFont(fonts['bold']);
}

async function getFont(font) {
 const fontDir = process.cwd() + '/font/';
 const fontPath = fontDir + font.file;
if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir);
 if (!fs.existsSync(fontPath)) {
  setLog('Font not found, downloading from ' + font.url + ' ...');
  const res = await fetch(font.url);
  if (!res.ok) {
   setLog('Error: Cannot download this font.');
   return;
  }
  await streamPipeline(res.body, fs.createWriteStream(fontPath));
  setLog('Font saved as: ' + fontPath);
 } else setLog('Font found in: ' + fontPath);
 canvas.registerFont(fontPath, { family: font.name });
 setLog('Font registered as: ' + font.name);
}

// TODO: getIcons()
// https://raw.githubusercontent.com/atisawd/boxicons/master/svg/solid/bxs-star.svg


async function getJSON(url) {
 const res = await fetch(url);
 if (res.ok) {
  const data = await res.json();
  return data;
 } else setLog('Web request failed with status: ' + res.status);
};

async function createImage(req, res, info) {
 const header = { text: info.name, fontName: fonts['bold'].name, fontSize: 20 };
 const lines = [
  { text: info.bio, fontName: fonts['regular'].name, fontSize: 14 },
  { text: info.login, fontName: fonts['regular'].name, fontSize: 18 },
  { text: info.public_repos + ' repos', fontName: fonts['regular'].name, fontSize: 18 },
  { text: info.public_gists + ' gists', fontName: fonts['regular'].name, fontSize: 18 },
  { text: info.followers + ' followers', fontName: fonts['regular'].name, fontSize: 18 },
  { text: info.following + ' following', fontName: fonts['regular'].name, fontSize: 18 },
  { text: 'Created: ' + new Date(info.created_at).toLocaleDateString(), fontName: fonts['regular'].name, fontSize: 16 },
 ];

 const titlePadding = 10;
 const avatarSize = 48;
 const linePadding = 10;
 const lineSpacing = 20;
 const totalWidth = 512;
 const offsetLeft = 10;
 let totalHeight = (2 * titlePadding) + avatarSize + (2 * linePadding);
 for (let i = 0; i < lines.length; i++) {
  if (lines[i].text != null) totalHeight += lines[i].fontSize + (i < lines.length - 1 ? lineSpacing : 0);
 }
 const can = canvas.createCanvas(totalWidth, totalHeight);
 const ctx = can.getContext('2d');

 // Window header
 const radius = 10;
 const topHeight = (2 * titlePadding) + avatarSize;
 ctx.fillStyle = '#A0A0A0';
 ctx.beginPath();
 ctx.moveTo(radius, 0);
 ctx.arcTo(totalWidth, 0, totalWidth, topHeight, Math.min(radius, topHeight));
 ctx.lineTo(totalWidth, topHeight);
 ctx.lineTo(0, topHeight);
 ctx.arcTo(0, 0, radius, 0, Math.min(radius, topHeight));
 ctx.closePath();
 ctx.fill();
 
 // Window body
 ctx.fillStyle = '#C0C0C0';
 ctx.beginPath();
 ctx.moveTo(0, topHeight);
 ctx.lineTo(totalWidth, topHeight);
 ctx.lineTo(totalWidth, totalHeight - radius);
 ctx.arcTo(totalWidth, totalHeight, totalWidth - radius, totalHeight, radius);
 ctx.lineTo(radius, totalHeight);
 ctx.arcTo(0, totalHeight, 0, totalHeight - radius, radius);
 ctx.lineTo(0, topHeight);
 ctx.closePath();
 ctx.fill();

 // Avatar
 const img = await canvas.loadImage(info.avatar_url);
 const imgRadius = avatarSize / 2;
 ctx.save();
 ctx.beginPath();
 ctx.arc(offsetLeft + imgRadius, titlePadding + imgRadius, imgRadius, 0, Math.PI * 2, true);
 ctx.closePath();
 ctx.clip();
 ctx.drawImage(img, offsetLeft, titlePadding, avatarSize, avatarSize);
 ctx.restore();
 ctx.beginPath();
 ctx.arc(offsetLeft + imgRadius, titlePadding + imgRadius, imgRadius, 0, Math.PI * 2, true);
 ctx.lineWidth = 1;
 ctx.strokeStyle = '#000000';
 ctx.stroke();
 
 // Title
 ctx.font = header.fontSize + 'px ' + header.fontName;
 ctx.fillStyle = '#000000';
 ctx.fillText(header.text, offsetLeft + avatarSize + 10, titlePadding + (avatarSize / 2) + (header.fontSize / 2));
 
 // Lines
 let currentHeight = (2 * titlePadding) + avatarSize + linePadding;
 for (let i = 0; i < lines.length; i++) {
  if (lines[i].text != null) {
   currentHeight += lines[i].fontSize;
   ctx.font = lines[i].fontSize + 'px ' + lines[i].fontName;
   ctx.fillText(lines[i].text, offsetLeft, currentHeight);
   currentHeight += lineSpacing;
  }
 };

 // Draw as PNG
 res.type('png');
 can.createPNGStream().pipe(res);
}

function createEmptyImage(req, res) {
 let fontSize = 20;
 let padding = 10;
 const text = 'Cannot read data from GitHub';
 const can = canvas.createCanvas(1, 1);
 const ctx = can.getContext('2d');
 ctx.font = fontSize + 'px Ubuntu Regular';
 const textSize = ctx.measureText(text);
 console.log(textSize.width);
 console.log(textSize.height);
 can.width = (2 * padding) + textSize.width;
 can.height = (2 * padding) + fontSize;
 ctx.font = fontSize + 'px Ubuntu Regular';
 ctx.fillStyle = '#000000';
 ctx.fillRect(0, 0, can.width, can.height);
 ctx.fillStyle = '#FFFFFF';
 ctx.fillText(text, padding, (can.height / 2) + (padding / 2));
 res.type('png');
 can.createPNGStream().pipe(res);
}

function loadSettings(file) {
 try {
  settings = JSON.parse(fs.readFileSync(file));
 } catch {
  console.log('Could not load settings from file: ' + file + ', creating new settings file ...');
  settings = {
   log_to_file: true,
   log_file: 'app.log'
  }
  fs.writeFileSync(process.cwd() + '/' + file, JSON.stringify(settings, null, 1));
  process.exit(1);
 }
}

function setLog(message) {
 const date = new Date().toLocaleString();
 console.log('\x1b[33m' + date + ':\x1b[0m ' + message);
 if (settings.log_to_file) fs.appendFileSync(process.cwd() + '/' + settings.log_file, date + ': ' + message + '\n');
}


/*
function getButton(context, x, y, text, fontSize, borderRadius, textColor, fillColor, padding) {
 context.font = fontSize + 'pt sans-serif'; // Nastavíme font předem, abychom mohli správně změřit šířku textu
 const textWidth = context.measureText(text).width;
 const buttonWidth = textWidth + padding * 2;
 const buttonHeight = fontSize + padding;
 context.fillStyle = fillColor;
 context.strokeStyle = '#333';
 context.lineWidth = 3;
 context.beginPath();
 context.moveTo(x + borderRadius, y);
 context.lineTo(x + buttonWidth - borderRadius, y);
 context.quadraticCurveTo(x + buttonWidth, y, x + buttonWidth, y + borderRadius);
 context.lineTo(x + buttonWidth, y + buttonHeight - borderRadius);
 context.quadraticCurveTo(x + buttonWidth, y + buttonHeight, x + buttonWidth - borderRadius, y + buttonHeight);
 context.lineTo(x + borderRadius, y + buttonHeight);
 context.quadraticCurveTo(x, y + buttonHeight, x, y + buttonHeight - borderRadius);
 context.lineTo(x, y + borderRadius);
 context.quadraticCurveTo(x, y, x + borderRadius, y);
 context.closePath();
 context.fill();
 context.stroke();
 context.fillStyle = textColor;
 context.textAlign = 'center';
 context.textBaseline = 'middle';
 context.fillText(text, x + buttonWidth / 2, y + buttonHeight / 2);
}
*/
