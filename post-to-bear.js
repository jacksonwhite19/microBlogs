const fs = require('fs');
const puppeteer = require('puppeteer');

const EMAIL = process.env.BEAR_EMAIL;
const PASSWORD = process.env.BEAR_PASSWORD;

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto('https://bearblog.dev/login');
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation(),
  ]);

  const journal = fs.readFileSync('journal.txt', 'utf-8');
  const posted = JSON.parse(fs.readFileSync('posted.json', 'utf-8'));

  const posts = journal.split('---').map(p => p.trim()).filter(Boolean);
  const newPosts = posts.filter(p => {
    const title = p.split('\n')[0].trim();
    return !posted.includes(title);
  });

  for (const post of newPosts) {
    const lines = post.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();

    await page.goto('https://bearblog.dev/new');
    await page.type('input[name="title"]', title);
    await page.type('textarea[name="body"]', body);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation(),
    ]);

    posted.push(title);
    console.log(`Posted: ${title}`);
  }

  fs.writeFileSync('posted.json', JSON.stringify(posted, null, 2));
  await browser.close();
})();
