const fs = require('fs');
const puppeteer = require('puppeteer');

const journalPath = 'journal.txt';
const postedPath = 'posted.json';

async function readJournal() {
  const raw = fs.readFileSync(journalPath, 'utf-8');
  return raw
    .split('---')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
}

function readPosted() {
  if (!fs.existsSync(postedPath)) return [];
  return JSON.parse(fs.readFileSync(postedPath, 'utf-8'));
}

function savePosted(posted) {
  fs.writeFileSync(postedPath, JSON.stringify(posted, null, 2));
}

async function login(page) {
  const email = process.env.BEAR_EMAIL;
  const password = process.env.BEAR_PASSWORD;

  await page.goto('https://bearblog.dev/login/', { waitUntil: 'networkidle2' });
  await page.type('input[name=email]', email);
  await page.type('input[name=password]', password);
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);
}

async function postEntry(page, content) {
  await page.goto('https://bearblog.dev/new/', { waitUntil: 'networkidle2' });

  // Simple title: first line
  const lines = content.split('\n');
  const title = lines[0].trim();
  const body = lines.slice(1).join('\n').trim();

  await page.type('input[name=title]', title);
  await page.type('textarea[name=body]', body);
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);
}

(async () => {
  const entries = await readJournal();
  const posted = readPosted();

  const toPost = entries.filter(e => !posted.includes(e));

  if (toPost.length === 0) {
    console.log('No new entries to post.');
    process.exit(0);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await login(page);

  for (const entry of toPost) {
    try {
      console.log('Posting:', entry.split('\n')[0]);
      await postEntry(page, entry);
      posted.push(entry);
      savePosted(posted);
    } catch (err) {
      console.error('Failed to post entry:', err);
    }
  }

  await browser.close();
})();
