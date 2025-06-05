const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const BBE_EMAIL = 'jacksonwhite19@icloud.com';
  const BBE_PASS = 'Bear1647!';

  let content;
  try {
    content = fs.readFileSync('daily-notes.md').toString();
    if (!content || typeof content !== 'string') throw new Error('Content empty or not string');
    console.log('✅ Loaded post content (length:', content.length, ')');
  } catch (err) {
    console.error('❌ Failed to load daily-notes.md:', err.message);
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',           // new headless mode (better compatibility)
    args: ['--no-sandbox'],    // optional, may help speed and stability
  });

  const page = await browser.newPage();

  // Set viewport and user agent to mimic real Chrome browser
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/114.0.0.0 Safari/537.36'
  );

  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('https://bearblog.dev/accounts/login/', { waitUntil: 'networkidle2' });

    console.log('⌛ Waiting for login form...');
    await page.waitForSelector('input[name="login"]', { timeout: 8000 });

    console.log('🔐 Filling in credentials...');
    await page.type('input[name="login"]', BBE_EMAIL, { delay: 30 });  // small delay to simulate typing
    await page.type('input[name="password"]', BBE_PASS, { delay: 30 });

    console.log('➡️ Logging in...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log('🏠 Navigating to dashboard...');
    await page.goto('https://bearblog.dev/jacksonwhite/dashboard/', { waitUntil: 'networkidle0' });

    console.log('✏️ Navigating to post edit page...');
    await page.goto('https://bearblog.dev/jacksonwhite/dashboard/posts/bBZgodqQYjQYjBXmMpbG/', { waitUntil: 'networkidle0' });

    console.log('📝 Updating post content...');
    await page.waitForSelector('textarea[name="body_content"]');
    await page.evaluate((newContent) => {
      const textarea = document.querySelector('textarea[name="body_content"]');
      if (!textarea) throw new Error('Textarea not found');
      textarea.value = newContent;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }, content);

    console.log('✅ Setting publish flag...');
    await page.evaluate(() => {
      const publishInput = document.getElementById('publish');
      if (publishInput) publishInput.value = true;
      else console.warn('⚠️ #publish input not found — post might not be published');
    });

    console.log('🚀 Clicking Publish button...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log('✅ Post published successfully!');
  } catch (err) {
    console.error('❌ Error occurred:', err.message);
  } finally {
    console.log('🧹 Closing browser...');
    await browser.close();
  }
})();
