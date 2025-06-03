const fs = require('fs');
const puppeteer = require('puppeteer');

const JOURNAL_PATH = 'journal.txt';
const LOG_PATH = 'posted.json';

function loadJournalEntries() {
  const content = fs.readFileSync(JOURNAL_PATH, 'utf-8');
  return content.split('\n---\n').map(entry => entry.trim()).filter(Boolean);
}

function loadPostedLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH));
  } catch (e) {
    return [];
  }
}

function savePostedLog(posted) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(posted, null, 2));
}

async function loginToBear(page, email, password) {
  await page.goto('https://bearblog.dev/login/', { waitUntil: 'networkidle2' });
  await page.type('input[name=email]', email);
  await page.type('input[name=password]', password);
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);
  console.log('✅ Logged in');
}

async function postEntry(page, content) {
  await page.goto('https://bearblog.dev/new/', { waitUntil: 'networkidle2' });

  const lines = content.split('\n');
  const title = lines[0].trim();
  const body = lines.slice(1).join('\n').trim();

  await page.type('input[name=title]', title);
  await page.type('textarea[name=body]', body);

  // Uncheck 'Listed' checkbox
  const checkbox = await page.$('input[name="listed"]');
  if (checkbox) {
    const isChecked = await (await checkbox.getProperty('checked')).jsonValue();
    if (isChecked) {
      await checkbox.click(); // unlist it
    }
  }

  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  const postUrl = page.url();
  console.log(`✅ Posted: ${title} → ${postUrl}`);
  return { title, url: postUrl };
}

async function updateMicroBlogPage(page, newLinkHtml) {
  const microBlogUrl = 'https://bearblog.dev/edit/micro-blog/';
  await page.goto(microBlogUrl, { waitUntil: 'networkidle2' });

  const bodyHandle = await page.$('textarea[name=body]');
  const oldContent = await (await bodyHandle.getProperty('value')).jsonValue();

  const newContent = `${newLinkHtml}\n\n${oldContent}`;
  await page.evaluate((content) => {
    document.querySelector('textarea[name=body]').value = content;
  }, newContent);

  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  console.log('✅ micro-blog page updated.');
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const email = process.env.BEAR_EMAIL;
  const password = process.env.BEAR_PASSWORD;

  await loginToBear(page, email, password);

  const entries = loadJournalEntries();
  const posted = loadPostedLog();

  for (const entry of entries) {
    if (!posted.includes(entry)) {
      const { title, url } = await postEntry(page, entry);
      posted.push(entry);

      const newLink = `- [${title}](${url})`;
      await updateMicroBlogPage(page, newLink);
    }
  }

  savePostedLog(posted);
  await browser.close();
})();
