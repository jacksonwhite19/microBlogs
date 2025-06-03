const puppeteer = require('puppeteer');
const JournalParser = require('./parse-journal');

class BearBlogPoster {
  constructor() {
    this.parser = new JournalParser();
    this.baseUrl = 'https://bearblog.dev';
  }

  async login(page, username, password) {
    console.log('Logging into Bear Blog...');
    
    // Go to login page
    await page.goto(`${this.baseUrl}/accounts/login/`, { waitUntil: 'networkidle2' });
    
    // Fill login form
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    
    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Login successful!');
  }

  async createPost(page, title, content) {
    console.log(`Creating post: "${title}"`);
    
    // Navigate to new post page
    await page.goto(`${this.baseUrl}/dashboard/posts/new/`, { waitUntil: 'networkidle2' });
    
    // Wait for form elements
    await page.waitForSelector('input[name="title"]', { timeout: 10000 });
    await page.waitForSelector('textarea[name="content"]', { timeout: 10000 });
    
    // Fill out the post form
    await page.type('input[name="title"]', title);
    await page.type('textarea[name="content"]', content);
    
    // Optionally set as published (you might want to save as draft first)
    try {
      await page.check('input[name="is_published"]');
    } catch (error) {
      console.log('Could not find publish checkbox, post might be saved as draft');
    }
    
    // Submit the form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log(`Post "${title}" created successfully!`);
  }

  async postNewEntries() {
    const newEntries = this.parser.getNewEntries();
    
    if (newEntries.length === 0) {
      console.log('No new entries to post.');
      return;
    }

    console.log(`Found ${newEntries.length} new entries to post.`);

    // Get credentials from environment variables
    const username = process.env.BEAR_USERNAME;
    const password = process.env.BEAR_PASSWORD;

    if (!username || !password) {
      throw new Error('BEAR_USERNAME and BEAR_PASSWORD environment variables are required');
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Login to Bear Blog
      await this.login(page, username, password);
      
      // Post each new entry
      for (const entry of newEntries) {
        try {
          await this.createPost(page, entry.title, entry.content);
          
          // Mark as posted
          this.parser.markAsPosted(entry.id);
          
          console.log(`✅ Successfully posted: ${entry.title}`);
          
          // Small delay between posts to be polite
          await page.waitForTimeout(2000);
          
        } catch (error) {
          console.error(`❌ Failed to post "${entry.title}":`, error.message);
          // Continue with other posts even if one fails
        }
      }
      
    } catch (error) {
      console.error('Error during posting process:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const poster = new BearBlogPoster();
  
  poster.postNewEntries()
    .then(() => {
      console.log('All done! 🎉');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = BearBlogPoster;